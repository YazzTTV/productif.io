import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from 'expo-superwall';
import { useLanguage } from '@/contexts/LanguageContext';
import { authService, type StudyBlock } from '@/lib/api';
import { useSuperwall } from '@/hooks/useSuperwall';
import { SUPERWALL_EVENTS } from '@/lib/superwallEvents';
import { getOnboardingAnswers } from '@/lib/onboardingDraft';
import { ensureSuperwallIdentity, loadPlanBlocks, peekPlanBlocks } from '@/lib/onboardingFlow';
import { trackOnboardingEvent, trackStepCompleted, useOnboardingStep } from '@/lib/onboardingTracking';
import {
  decideTrialExit,
  nextBlockToLock,
  summarizePlan,
  trialHeadline,
  trialInsights,
  type Copy,
  type TrialPaywallOutcome,
} from '@/lib/onboardingPlanView';
import { markTutorialDone } from '@/tutorial/tutorialStorage';
import { getExamAccess, type ExamAccess } from '@/utils/premium';
import {
  ONBOARDING_GREEN,
  OnboardingScreen,
  PrimaryButton,
  SecondaryButton,
  onboardingText,
} from '@/components/onboarding/OnboardingUI';

/**
 * Ecran avant le paywall (spec 1.5, ecran 10). Il vend le blocage AUTOMATIQUE,
 * construit sur le premier vrai bloc du planning : « Demain 9h00, Anatomie
 * ch. 1 : tes applis se verrouillent toutes seules. »
 *
 * Trois regles tenues ici :
 *   - jamais le mot « essai » : l'app ne connait pas l'eligibilite a l'offre
 *     d'essai, seul le paywall Superwall la connait (regle Apple 3.1.2). Le
 *     tableau compare « Gratuit » et « Premium » ;
 *   - le didacticiel est marque termine en arrivant ici, sinon l'accueil
 *     renvoyait l'etudiant sur /tasks-new?tutorial=subjects lui redemander les
 *     matieres qu'il vient de donner (DashboardEnhanced, etape « calendar ») ;
 *   - avant le paywall, l'identite Superwall est ATTENDUE (critique, point 8) :
 *     un achat fait sous l'alias anonyme n'est rattache a aucun compte.
 *
 * Sorties : achat ou deja premium vers premium-setup, refus ou « Plus tard »
 * vers free-sessions. Placement absent du tableau de bord (Superwall rend
 * `presented` sans rien afficher) : `paywall_skipped`, puis on continue. Les
 * regles de sortie sont dans lib/onboardingPlanView.ts (decideTrialExit).
 */

function renderCopy(t: (key: string, params?: Record<string, string | number>, fallback?: string) => string, copy: Copy) {
  return t(copy.key, copy.params, copy.fallback);
}

export default function TrialScreen() {
  const { t, language } = useLanguage();
  const { triggerEvent } = useSuperwall();
  const { user: superwallUser, identify } = useUser();
  const [blocks, setBlocks] = useState<StudyBlock[] | null>(() => peekPlanBlocks());
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [access, setAccess] = useState<ExamAccess | null>(null);
  const [now] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useOnboardingStep('trial');

  useEffect(() => {
    let alive = true;
    // Le didacticiel de l'accueil n'a plus rien a apprendre a quelqu'un qui a
    // deja son planning. Pose ici et pas a la sortie : « Plus tard », le paywall
    // ou une app tuee sur cet ecran menent tous a l'accueil.
    void markTutorialDone().catch((error) => console.warn('[Onboarding] didacticiel non marque', error));
    // Compte en cache pour la verification d'identite du bouton, et seances
    // offertes pour le tableau.
    void authService.checkAuth().catch(() => null);
    getExamAccess()
      .then((loaded) => {
        if (alive) setAccess(loaded);
      })
      .catch(() => {});
    getOnboardingAnswers()
      .then((loaded) => {
        if (alive) setAnswers(loaded);
      })
      .catch(() => {});
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

  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';
  const formatDay = (date: Date) => date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  const summary = useMemo(() => summarizePlan(blocks ?? [], now), [blocks, now]);
  const next = useMemo(() => nextBlockToLock(blocks ?? [], now), [blocks, now]);
  const headline = trialHeadline(next, now, formatDay);
  const insights = useMemo(() => trialInsights(answers, summary), [answers, summary]);

  const freeCell = (() => {
    const remaining = access && !access.premium ? access.freeRemaining : null;
    // Le nombre vient du serveur (examFreeRemaining) : la regle peut changer
    // sans build, le tableau ne doit jamais l'ecrire en dur.
    if (remaining === null) return t('onbTrialFreeSessionsLimited', undefined, 'Limitées');
    if (remaining <= 0) return t('onbTrialFreeSessionsNone', undefined, 'Utilisées');
    if (remaining === 1) return t('onbTrialFreeSessionsOne', undefined, '1 offerte');
    return t('onbTrialFreeSessionsMany', { count: remaining }, '{count} offertes');
  })();

  const rows: Array<{ key: string; label: string; free: string | boolean; premium: string | boolean }> = [
    {
      key: 'plan',
      label: t('onbTrialRowPlan', undefined, 'Planning sur 14 jours, recalculé chaque nuit'),
      free: true,
      premium: true,
    },
    {
      key: 'reminders',
      label: t('onbTrialRowReminders', undefined, 'Rappels avant chaque séance'),
      free: true,
      premium: true,
    },
    {
      key: 'sessions',
      label: t('onbTrialRowSessions', undefined, 'Séances avec applis bloquées'),
      free: freeCell,
      premium: t('onbTrialUnlimited', undefined, 'Illimitées'),
    },
    {
      key: 'auto',
      label: t('onbTrialRowAuto', undefined, "Blocage automatique à l'heure de tes séances"),
      free: false,
      premium: true,
    },
  ];

  const leave = (target: 'premium-setup' | 'free-sessions', from: string) => {
    router.replace({ pathname: `/(onboarding-new)/${target}`, params: { from } } as any);
  };

  const handleActivate = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const placement = SUPERWALL_EVENTS.ONBOARDING_TRIAL_CTA;
    trackOnboardingEvent('trial_cta_tapped', { sessions: summary.sessions, has_block: !!next });

    let outcome: TrialPaywallOutcome;
    try {
      const identity = await ensureSuperwallIdentity(superwallUser?.appUserId ?? null, identify);
      if (identity === 'failed') {
        console.warn('[Onboarding] paywall presente sans identite Superwall confirmee');
      }
      const result = await triggerEvent(placement, {
        params: { source: 'onboarding_trial', sessions: summary.sessions, subjects: summary.subjects },
        requireNonPremium: true,
        bypassCooldown: true,
      });
      outcome = {
        kind: 'result',
        reason: result.reason,
        presented: result.presented,
        result: result.result,
        skippedReason: result.skippedReason,
      };
    } catch (error) {
      // `triggerEvent` laisse remonter les erreurs du SDK : l'entree dans l'app
      // ne doit jamais en dependre.
      console.warn('[Onboarding] paywall de l essai en echec', error);
      outcome = { kind: 'error' };
    }

    const exit = decideTrialExit(outcome);
    if (exit.skipped) trackOnboardingEvent('paywall_skipped', { placement, reason: exit.skipped });

    let target: 'premium-setup' | 'free-sessions';
    if (exit.next === 'verify') {
      // Le paywall n'a rien dit d'utile : on relit l'abonnement, serveur hors
      // cache puis StoreKit. Un abonne ne doit pas atterrir sur « refus ».
      const verified = await getExamAccess({ force: true }).catch(() => null);
      target = verified?.premium ? 'premium-setup' : 'free-sessions';
    } else {
      target = exit.next;
    }

    trackStepCompleted('trial', {
      choice: 'activate',
      outcome: outcome.kind === 'error' ? 'error' : outcome.result ?? outcome.reason,
      next: target,
    });
    leave(target, outcome.kind === 'result' && outcome.reason === 'premium_user' ? 'already_premium' : 'paywall');
  };

  const handleLater = () => {
    if (busyRef.current) return;
    busyRef.current = true;
    trackStepCompleted('trial', { choice: 'later' });
    leave('free-sessions', 'later');
  };

  return (
    <OnboardingScreen
      footer={
        <>
          <PrimaryButton
            label={t('onbTrialCta', undefined, 'Activer le blocage automatique')}
            onPress={handleActivate}
            loading={busy}
            disabled={blocks === null}
          />
          <SecondaryButton label={t('onbTrialLater', undefined, 'Plus tard')} onPress={handleLater} disabled={busy} />
        </>
      }
    >
      <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={28} color={ONBOARDING_GREEN} />
        </View>
        <Text style={onboardingText.title}>{renderCopy(t, headline)}</Text>
        <Text style={onboardingText.subtitle}>
          {t(
            'onbTrialSubtitle',
            undefined,
            "Avec Premium, le blocage se lance tout seul à l'heure de ton planning : rien à démarrer, et pas de bouton pour tricher."
          )}
        </Text>
      </Animated.View>

      {insights.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.insights}>
          {insights.map((copy) => (
            <Text key={copy.key} style={styles.insightText}>
              {renderCopy(t, copy)}
            </Text>
          ))}
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.table}>
        <View style={[styles.tableRow, styles.tableHead]}>
          <Text style={[styles.tableLabel, styles.tableHeadText]} />
          <Text style={[styles.tableCell, styles.tableHeadText]}>{t('onbTrialColFree', undefined, 'Gratuit')}</Text>
          <Text style={[styles.tableCell, styles.tableHeadText, styles.tablePremium]}>
            {t('onbTrialColPremium', undefined, 'Premium')}
          </Text>
        </View>
        {rows.map((row, index) => (
          <View key={row.key} style={[styles.tableRow, index === rows.length - 1 && styles.tableRowLast]}>
            <Text style={styles.tableLabel}>{row.label}</Text>
            <TableValue value={row.free} />
            <TableValue value={row.premium} premium />
          </View>
        ))}
      </Animated.View>
    </OnboardingScreen>
  );
}

function TableValue({ value, premium = false }: { value: string | boolean; premium?: boolean }) {
  if (typeof value === 'string') {
    return <Text style={[styles.tableCell, styles.tableValueText, premium && styles.tablePremium]}>{value}</Text>;
  }
  return (
    <View style={styles.tableCellIcon}>
      {value ? (
        <Ionicons name="checkmark-circle" size={20} color={premium ? ONBOARDING_GREEN : 'rgba(0, 0, 0, 0.45)'} />
      ) : (
        <Ionicons name="remove" size={20} color="rgba(0, 0, 0, 0.25)" />
      )}
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
  insights: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    gap: 10,
    marginBottom: 24,
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#0F5132',
  },
  table: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableHead: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  tableHeadText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  tableLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    color: '#000000',
    paddingRight: 8,
  },
  tableCell: {
    width: 76,
    textAlign: 'center',
  },
  tableCellIcon: {
    width: 76,
    alignItems: 'center',
  },
  tableValueText: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  tablePremium: {
    color: ONBOARDING_GREEN,
    fontWeight: '600',
  },
});
