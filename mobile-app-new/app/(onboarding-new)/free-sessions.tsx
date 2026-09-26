import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, InteractionManager, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import type { StudyBlock } from '@/lib/api';
import { finishOnboardingFlow, loadPlanBlocks, peekPlanBlocks } from '@/lib/onboardingFlow';
import { trackStepCompleted, useOnboardingStep } from '@/lib/onboardingTracking';
import {
  blockLabel,
  examParamsForBlock,
  formatHour,
  freeSessionsTitle,
  localDayOffset,
  nextBlockToLock,
  type Copy,
} from '@/lib/onboardingPlanView';
import {
  getAuthorizationStatus,
  getBlockedSelectionCount,
  isAppBlockingSupported,
  requestAuthorization,
} from '@/utils/appBlocking';
import { getExamAccess, type ExamAccess } from '@/utils/premium';
import {
  ONBOARDING_GREEN,
  OnboardingScreen,
  PrimaryButton,
  SecondaryButton,
  onboardingText,
} from '@/components/onboarding/OnboardingUI';

/**
 * Apres un refus du paywall, ou « Plus tard » (spec 1.5, ecran 12b) : les
 * seances Mode Examen offertes, avec blocage, au nombre que tient le SERVEUR
 * (`examFreeRemaining` de GET /api/auth/me, 2 au total pour un compte neuf).
 *
 * RIEN N'EST ARME SANS LE BOUTON « Preparer ma seance » : ni la boite Temps
 * d'ecran, ni le choix des applis, ni une seance. Le bouton fait les deux
 * premiers (autorisation, puis /exam/blocked-apps si aucune appli n'est
 * choisie), puis ouvre le reglage de la seance sur le premier chapitre du
 * planning. Le reglage s'ouvre PAR-DESSUS l'accueil : son bouton retour y
 * ramene, et c'est lui qui decompte la seance au lancement (/api/exam/start).
 *
 * Pas d'autre paywall ici : l'etudiant vient d'en fermer un. Le paywall revient
 * a la fin d'une seance offerte, a la 3e, et a l'interrupteur du blocage
 * automatique (lot Mode Examen).
 */

function renderCopy(t: (key: string, params?: Record<string, string | number>, fallback?: string) => string, copy: Copy) {
  return t(copy.key, copy.params, copy.fallback);
}

export default function FreeSessionsScreen() {
  const { t, language } = useLanguage();
  const params = useLocalSearchParams<{ from?: string }>();
  const [access, setAccess] = useState<ExamAccess | null>(null);
  const [blocks, setBlocks] = useState<StudyBlock[] | null>(() => peekPlanBlocks());
  const [now] = useState(() => new Date());
  const [preparing, setPreparing] = useState(false);
  const pendingSelectionRef = useRef(false);
  const leavingRef = useRef(false);

  useOnboardingStep('free-sessions');

  useEffect(() => {
    let alive = true;
    // Hors cache : le nombre peut avoir change (achat ailleurs, autre appareil),
    // et un compte finalement premium n'a rien a faire sur cet ecran.
    getExamAccess({ force: true })
      .then((loaded) => {
        if (!alive) return;
        if (loaded.premium) {
          // Meme raison que dans chapters.tsx : la vue est partie, il faut une
          // sortie, sinon ce compte premium compte comme un abandon ici.
          trackStepCompleted('free-sessions', {
            choice: 'redirect_premium',
            from: typeof params.from === 'string' ? params.from : null,
          });
          router.replace({ pathname: '/(onboarding-new)/premium-setup', params: { from: 'free_sessions_check' } } as any);
          return;
        }
        setAccess(loaded);
      })
      .catch(() => {
        if (alive) setAccess({ premium: false, premiumSource: null, freeRemaining: null, canStart: false });
      });
    if (blocks === null) {
      loadPlanBlocks().then((loaded) => {
        if (alive) setBlocks(loaded ?? []);
      });
    }
    return () => {
      alive = false;
    };
    // Une seule fois, a l'arrivee.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = nextBlockToLock(blocks ?? [], now);
  const remaining = access ? access.freeRemaining : null;
  const canPrepare = !!access?.canStart;
  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';

  const report = (choice: string, extra: Record<string, string | number | boolean | null> = {}) => {
    trackStepCompleted('free-sessions', {
      choice,
      from: typeof params.from === 'string' ? params.from : null,
      free_remaining: remaining,
      ...extra,
    });
  };

  const goHome = async (choice: 'later' | 'home') => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    report(choice);
    await finishOnboardingFlow(`free_sessions_${choice}`);
    router.replace('/(tabs)');
  };

  const goToSession = useCallback(
    async (how: string) => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      const supported = isAppBlockingSupported();
      report('prepare', {
        how,
        authorized: supported ? getAuthorizationStatus() === 'approved' : null,
        apps: supported ? getBlockedSelectionCount() : null,
      });
      await finishOnboardingFlow('free_sessions_prepare');
      const sessionParams = examParamsForBlock(next);
      router.replace('/(tabs)');
      // Apres l'accueil, et non a sa place : ouvert seul, l'ecran de reglage
      // n'aurait rien sous lui et son bouton retour ne menerait nulle part
      // (meme famille que le cul-de-sac du 10 aout). Meme enchainement que
      // connection.tsx, le temps que les onglets soient montes.
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          router.push({ pathname: '/exam/setup', params: sessionParams } as any);
        }, 150);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [next, remaining]
  );

  // Retour du choix des applis : on continue vers la seance, applis choisies ou non
  // (l'ecran de reglage redemande s'il n'y en a aucune).
  useFocusEffect(
    useCallback(() => {
      if (!pendingSelectionRef.current) return;
      pendingSelectionRef.current = false;
      void goToSession(getBlockedSelectionCount() > 0 ? 'apps_chosen' : 'apps_skipped');
    }, [goToSession])
  );

  // On sort TOUJOURS de l'onboarding avant d'ouvrir le Mode Examen : le choix
  // des applis ouvert d'ici laissait l'onboarding sous lui, et un retour y
  // ramenait l'etudiant (retour de Noah, 26 septembre). L'ecran de reglage du
  // Mode Examen demande lui-meme l'autorisation et les applis.
  const handlePrepare = async () => {
    if (preparing || leavingRef.current) return;
    setPreparing(true);
    try {
      await goToSession('direct');
    } finally {
      setPreparing(false);
    }
  };

  const nextLine = (() => {
    if (!next) return null;
    const start = new Date(next.start);
    const offset = localDayOffset(start, now);
    const time = formatHour(start);
    const label = blockLabel(next);
    if (offset <= 0) {
      return t('onbFreeNextToday', { time, label, minutes: next.minutes }, "Aujourd'hui {time} : {label}, {minutes} min");
    }
    if (offset === 1) {
      return t('onbFreeNextTomorrow', { time, label, minutes: next.minutes }, 'Demain {time} : {label}, {minutes} min');
    }
    const day = start.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    return t(
      'onbFreeNextLater',
      { day: day.charAt(0).toUpperCase() + day.slice(1), time, label, minutes: next.minutes },
      '{day} {time} : {label}, {minutes} min'
    );
  })();

  if (access === null) {
    return (
      <OnboardingScreen centered>
        <ActivityIndicator size="large" color={ONBOARDING_GREEN} />
      </OnboardingScreen>
    );
  }

  const body = (() => {
    if (canPrepare) {
      return t(
        'onbFreeBody',
        undefined,
        "Pendant une séance, les applis que tu choisis restent verrouillées jusqu'à la fin, sans bouton « Ignorer la limite ». Rien ne se lance sans toi : tu choisis quand."
      );
    }
    if (remaining === 0) {
      return t(
        'onbFreeBodyNone',
        undefined,
        'Ton planning et tes rappels restent gratuits. Tu peux réviser chaque séance en Focus, sans blocage.'
      );
    }
    return t('onbFreeBodyUnknown', undefined, "Ton planning et tes rappels t'attendent sur ton accueil.");
  })();

  return (
    <OnboardingScreen
      footer={
        canPrepare ? (
          <>
            {/* Le planning d'abord : la plupart ne lancent pas une seance tout de
                suite, la seance offerte reste accessible depuis l'accueil. */}
            <PrimaryButton
              label={t('onbFreeGoPlanning', undefined, 'Aller à mon planning')}
              onPress={() => void goHome('home')}
              disabled={preparing}
            />
            <SecondaryButton
              label={t('onbFreePrepareNow', undefined, 'Préparer une séance maintenant')}
              onPress={handlePrepare}
              disabled={preparing}
            />
          </>
        ) : (
          <PrimaryButton label={t('onbFreeGoHome', undefined, "Aller à l'accueil")} onPress={() => void goHome('home')} />
        )
      }
    >
      <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name={canPrepare ? 'gift-outline' : 'calendar-outline'} size={28} color={ONBOARDING_GREEN} />
        </View>
        <Text style={onboardingText.title}>
          {renderCopy(t, freeSessionsTitle(remaining))}
        </Text>
        <Text style={onboardingText.subtitle}>{body}</Text>
      </Animated.View>

      {canPrepare && nextLine ? (
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.nextCard}>
          <Text style={styles.nextLabel}>{t('onbFreeNextTitle', undefined, 'Ta prochaine séance')}</Text>
          <Text style={styles.nextText}>{nextLine}</Text>
        </Animated.View>
      ) : null}
    </OnboardingScreen>
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
  nextCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  nextLabel: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.5)',
    marginBottom: 6,
  },
  nextText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
  },
});
