import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { syncStudyPlan } from '@/lib/studyPlanSync';
import { useStudyPlanCopy } from '@/hooks/useStudyPlanSync';
import { finishOnboardingFlow, loadPlanBlocks, peekPlanBlocks, waitForServerPremium } from '@/lib/onboardingFlow';
import { trackStepCompleted, useOnboardingStep } from '@/lib/onboardingTracking';
import { autoBlockResultCopy, nextBlockToLock, type Copy } from '@/lib/onboardingPlanView';
import {
  getAuthorizationStatus,
  getBlockedSelectionCount,
  isAppBlockingSupported,
  requestAuthorization,
  resolveAuthorizationStatus,
} from '@/utils/appBlocking';
import { setAutoBlockEnabled } from '@/utils/autoBlocking';
import type { StudyBlock } from '@/lib/api';
import {
  ONBOARDING_GREEN,
  OnboardingScreen,
  PrimaryButton,
  SecondaryButton,
  onboardingText,
} from '@/components/onboarding/OnboardingUI';

/**
 * Apres l'achat (spec 1.5, ecran 12a) : ce qu'il faut pour que l'achat serve a
 * quelque chose des aujourd'hui. Trois gestes, dans l'ordre impose par iOS :
 *   1. l'autorisation Temps d'ecran (Family Controls), sans laquelle rien ne
 *      peut etre bloque ;
 *   2. le choix des applis, sur l'ecran existant /exam/blocked-apps : iOS ne
 *      laisse pas l'app lire la liste, seulement la compter ;
 *   3. le blocage automatique, active par setAutoBlockEnabled puis programme
 *      par une synchronisation forcee du planning.
 *
 * Le webhook de l'achat arrive souvent APRES la fermeture du paywall, et la
 * synchronisation ne programme le blocage automatique que pour un compte que le
 * SERVEUR voit premium (lib/studyPlanSync.ts, readPremium). On relit donc le
 * compte hors cache des l'arrivee sur l'ecran, pendant que l'etudiant fait les
 * gestes 1 et 2 ; l'activation l'attend. Si le serveur ne l'a toujours pas vu,
 * l'ecran le dit, et l'interrupteur reste pose : la synchronisation suivante
 * programmera le blocage.
 *
 * Pas de rappel « fin de l'essai » a J5 : l'app ne sait pas si l'achat est un
 * essai (meme raison que l'absence du mot hors du paywall).
 */

/** Relecture du compte apres achat : le webhook peut suivre la fermeture du paywall. */
const SERVER_PREMIUM_WAIT_MS = 12_000;

type AuthStatus = ReturnType<typeof getAuthorizationStatus>;

function renderCopy(t: (key: string, params?: Record<string, string | number>, fallback?: string) => string, copy: Copy) {
  return t(copy.key, copy.params, copy.fallback);
}

export default function PremiumSetupScreen() {
  const { t, language } = useLanguage();
  const studyCopy = useStudyPlanCopy();
  const params = useLocalSearchParams<{ from?: string }>();
  const supported = isAppBlockingSupported();
  const [auth, setAuth] = useState<AuthStatus>(() => getAuthorizationStatus());
  const [apps, setApps] = useState(() => (supported ? getBlockedSelectionCount() : 0));
  const [activation, setActivation] = useState<{ status: string | null; scheduled: number } | null>(null);
  const [working, setWorking] = useState(false);
  const [blocks, setBlocks] = useState<StudyBlock[] | null>(() => peekPlanBlocks());
  const [now] = useState(() => new Date());
  const serverPremiumRef = useRef<Promise<boolean> | null>(null);
  const serverPremiumResultRef = useRef<boolean | null>(null);
  const leavingRef = useRef(false);

  useOnboardingStep('premium-setup');

  useEffect(() => {
    // Lancee tout de suite, attendue seulement a l'activation.
    const pending = waitForServerPremium(SERVER_PREMIUM_WAIT_MS);
    serverPremiumRef.current = pending;
    pending.then((confirmed) => {
      serverPremiumResultRef.current = confirmed;
    });
    if (supported) {
      // Au demarrage a froid iOS repond `notDetermined` un instant avant le vrai statut.
      resolveAuthorizationStatus().then(setAuth).catch(() => {});
    }
    if (blocks === null) {
      loadPlanBlocks().then((loaded) => setBlocks(loaded ?? []));
    }
    // Une seule fois, a l'arrivee.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retour de l'ecran de choix des applis (qui peut aussi demander l'autorisation).
  useFocusEffect(
    useCallback(() => {
      if (!supported) return;
      setAuth(getAuthorizationStatus());
      setApps(getBlockedSelectionCount());
    }, [supported])
  );

  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';
  const formatDay = (date: Date) => date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  const authorized = auth === 'approved';
  const hasApps = apps > 0;
  const activated = activation !== null;

  const requestAuth = async () => {
    const granted = await requestAuthorization();
    setAuth(granted ? 'approved' : getAuthorizationStatus());
  };

  const activate = async () => {
    await setAutoBlockEnabled(true);
    // Le serveur doit voir l'abonnement avant la synchronisation, sinon elle
    // repond `not_premium` et n'arme rien. Deja resolu si les gestes 1 et 2 ont
    // pris plus de 12 s.
    const confirmed = serverPremiumRef.current ? await serverPremiumRef.current.catch(() => false) : false;
    serverPremiumResultRef.current = confirmed;
    const result = await syncStudyPlan(studyCopy, { force: true }).catch(() => null);
    setActivation({
      status: result?.autoBlock?.status ?? null,
      scheduled: result?.autoBlock?.scheduled ?? 0,
    });
  };

  const leave = async (choice: 'done' | 'later' | 'unsupported') => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    trackStepCompleted('premium-setup', {
      choice,
      from: typeof params.from === 'string' ? params.from : null,
      authorized,
      apps,
      auto_block: activation?.status ?? null,
      scheduled: activation?.scheduled ?? null,
      server_premium: serverPremiumResultRef.current,
    });
    await finishOnboardingFlow(`premium_setup_${choice}`);
    router.replace('/(tabs)');
  };

  const handlePrimary = async () => {
    if (working || leavingRef.current) return;
    if (!supported) {
      void leave('unsupported');
      return;
    }
    setWorking(true);
    try {
      if (!authorized) {
        await requestAuth();
        return;
      }
      if (!hasApps) {
        router.push('/exam/blocked-apps');
        return;
      }
      if (!activated) {
        await activate();
        return;
      }
      await leave('done');
    } finally {
      setWorking(false);
    }
  };

  const primaryLabel = (() => {
    if (!supported) return t('onbSetupGoHome', undefined, "Aller à l'accueil");
    if (!authorized) return t('onbSetupAllow', undefined, "Autoriser le Temps d'écran");
    if (!hasApps) return t('onbSetupChooseApps', undefined, 'Choisir mes applis');
    if (!activated) return t('onbSetupActivate', undefined, 'Activer le blocage automatique');
    return t('onbSetupDone', undefined, "C'est parti");
  })();

  const next = nextBlockToLock(blocks ?? [], now);
  const activationText = activation
    ? renderCopy(t, autoBlockResultCopy(activation.status, activation.scheduled, next, now, formatDay))
    : t('onbSetupStep3Text', undefined, "À l'heure de chaque séance, tes applis se ferment toutes seules, et se rouvrent à la fin.");

  if (!supported) {
    return (
      <OnboardingScreen
        centered
        footer={<PrimaryButton label={primaryLabel} onPress={handlePrimary} />}
      >
        <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={30} color={ONBOARDING_GREEN} />
          </View>
          <Text style={onboardingText.title}>{t('onbSetupTitleUnsupported', undefined, 'Premium est activé')}</Text>
          <Text style={onboardingText.subtitle}>
            {t(
              'onbSetupUnsupportedText',
              undefined,
              "Le blocage des applis a besoin du Temps d'écran d'un iPhone : il n'est pas disponible sur cet appareil. Ton planning et tes rappels, eux, fonctionnent."
            )}
          </Text>
        </Animated.View>
      </OnboardingScreen>
    );
  }

  return (
    <OnboardingScreen
      footer={
        <>
          <PrimaryButton label={primaryLabel} onPress={handlePrimary} loading={working} />
          {!activated ? (
            <SecondaryButton
              label={t('onbSetupLater', undefined, 'Plus tard')}
              onPress={() => void leave('later')}
              disabled={working}
            />
          ) : null}
        </>
      }
    >
      <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={28} color={ONBOARDING_GREEN} />
        </View>
        <Text style={onboardingText.title}>{t('onbSetupTitle', undefined, 'Trois réglages, et tout est automatique')}</Text>
        <Text style={onboardingText.subtitle}>
          {t(
            'onbSetupSubtitle',
            undefined,
            'Pour que tes séances verrouillent tes applis toutes seules, iOS a besoin de ton accord.'
          )}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.steps}>
        <Step
          index={1}
          done={authorized}
          current={!authorized}
          title={t('onbSetupStep1Title', undefined, "Autoriser le Temps d'écran")}
          text={
            auth === 'denied'
              ? // Texte deja traduit de l'ecran de choix des applis. Pas de lien
                // vers les Reglages : openSettings ouvre la page de l'app, pas
                // celle du Temps d'ecran ou se trouve l'autorisation.
                t(
                  'blockAppsDenied',
                  undefined,
                  "Autorisation refusée. Tu peux la réactiver dans Réglages, Temps d'écran, puis productif.io."
                )
              : t(
                  'onbSetupStep1Text',
                  undefined,
                  "iOS te demande ton accord pour que l'app puisse verrouiller des applis. Rien ne se bloque en dehors de tes séances."
                )
          }
        />
        <Step
          index={2}
          done={authorized && hasApps}
          current={authorized && !hasApps}
          title={t('onbSetupStep2Title', undefined, 'Choisir les applis à bloquer')}
          text={
            hasApps
              ? apps === 1
                ? t('onbSetupStep2One', undefined, '1 appli choisie.')
                : t('onbSetupStep2Many', { count: apps }, '{count} applis choisies.')
              : t('onbSetupStep2Text', undefined, 'Celles qui te font décrocher : réseaux, vidéos, jeux.')
          }
          action={
            authorized && hasApps
              ? { label: t('onbSetupEditApps', undefined, 'Modifier'), onPress: () => router.push('/exam/blocked-apps') }
              : null
          }
        />
        <Step
          index={3}
          done={activated && activation?.status === 'active'}
          current={authorized && hasApps && !(activated && activation?.status === 'active')}
          title={t('onbSetupStep3Title', undefined, 'Activer le blocage automatique')}
          text={activationText}
        />
      </Animated.View>
    </OnboardingScreen>
  );
}

function Step({
  index,
  done,
  current,
  title,
  text,
  action = null,
}: {
  index: number;
  done: boolean;
  current: boolean;
  title: string;
  text: string;
  action?: { label: string; onPress: () => void } | null;
}) {
  return (
    <View style={[styles.step, current && styles.stepCurrent]}>
      <View style={[styles.stepBadge, done && styles.stepBadgeDone]}>
        {done ? (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        ) : (
          <Text style={styles.stepBadgeText}>{index}</Text>
        )}
      </View>
      <View style={styles.stepBody}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepText}>{text}</Text>
        {action ? (
          <Text style={styles.stepAction} onPress={action.onPress} accessibilityRole="button">
            {action.label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  steps: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    gap: 12,
  },
  stepCurrent: {
    borderColor: ONBOARDING_GREEN,
    backgroundColor: 'rgba(22, 163, 74, 0.04)',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeDone: {
    backgroundColor: ONBOARDING_GREEN,
  },
  stepBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  stepAction: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: ONBOARDING_GREEN,
  },
});
