import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import type { StudyBlock } from '@/lib/api';
import { getOnboardingAnswers, useOnboardingDraft } from '@/lib/onboardingDraft';
import { getLastAppleBusySlots } from '@/lib/onboardingCalendar';
import { loadPlanBlocks, peekPlanBlocks } from '@/lib/onboardingFlow';
import { trackStepCompleted, useOnboardingStep } from '@/lib/onboardingTracking';
import {
  blockLabel,
  busyLineForDay,
  formatHour,
  groupBlocksByDay,
  planInsights,
  summarizePlan,
  type Copy,
} from '@/lib/onboardingPlanView';
import { maybePrimePushPermission } from '@/lib/pushPermission';
import { syncStudyPlan } from '@/lib/studyPlanSync';
import { useStudyPlanCopy } from '@/hooks/useStudyPlanSync';
import {
  ONBOARDING_GREEN,
  OnboardingScreen,
  PrimaryButton,
  onboardingText,
} from '@/components/onboarding/OnboardingUI';

/**
 * Ecran du planning (spec 1.5, ecran 9), a la place de ideal-day dans le
 * parcours : les VRAIS blocs sur 14 jours, jour par jour, les heures de cours en
 * gris, et un cadenas « avec Premium » sur chaque seance. Jamais le mot
 * « essai » : seul le paywall connait l'eligibilite (regle Apple 3.1.2).
 *
 * Condition de la decision du 25 septembre : les reponses du questionnaire
 * RESSORTENT ici, en phrases construites sur les reponses reelles
 * (lib/onboardingPlanView.ts, planInsights), sinon la prise de conscience
 * qu'il provoque ne se convertit en rien.
 *
 * La permission de notification se demande ICI, au montage, comme le faisait
 * ideal-day : l'etudiant vient de voir ses seances avec leurs heures, un rappel
 * a ces heures-la se comprend tout seul. Jamais dans le geste qui mene au
 * paywall : la boite systeme et le paywall se sont deja superposes (17 septembre).
 */

/** Laisse les animations d'entree se poser avant l'alerte, comme ideal-day. */
const PUSH_PRIMING_DELAY_MS = 900;
/** Planning vide a l'arrivee : le calcul complet du serveur peut encore l'ecrire. */
const EMPTY_REFRESH_MS = 4_000;

function renderCopy(t: (key: string, params?: Record<string, string | number>, fallback?: string) => string, copy: Copy) {
  return t(copy.key, copy.params, copy.fallback);
}

export default function PlanningScreen() {
  const { t, language } = useLanguage();
  const studyCopy = useStudyPlanCopy();
  const { draft } = useOnboardingDraft();
  const [blocks, setBlocks] = useState<StudyBlock[] | null>(() => peekPlanBlocks());
  const [answers, setAnswers] = useState<Record<string, unknown> | null>(null);
  const [now] = useState(() => new Date());
  const leavingRef = useRef(false);
  const refreshedRef = useRef(false);

  useOnboardingStep('planning');

  // Blocs du calcul s'ils sont en memoire, sinon ceux du serveur (app relancee).
  useEffect(() => {
    let alive = true;
    if (blocks === null) {
      loadPlanBlocks().then((loaded) => {
        if (alive) setBlocks(loaded ?? []);
      });
    }
    return () => {
      alive = false;
    };
  }, [blocks]);

  // Une seule relecture si le planning arrive vide : `partial` du serveur.
  useEffect(() => {
    if (blocks === null || blocks.length > 0 || refreshedRef.current) return;
    refreshedRef.current = true;
    const timer = setTimeout(() => {
      loadPlanBlocks({ force: true }).then((loaded) => {
        if (loaded && loaded.length > 0) setBlocks(loaded);
      });
    }, EMPTY_REFRESH_MS);
    return () => clearTimeout(timer);
  }, [blocks]);

  useEffect(() => {
    let alive = true;
    getOnboardingAnswers()
      .then((loaded) => {
        if (alive) setAnswers(loaded);
      })
      .catch(() => {
        if (alive) setAnswers({});
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      // L'etudiant est deja parti vers l'ecran suivant (qui garde celui-ci
      // monte sous lui) : l'alerte s'ouvrirait par-dessus.
      if (leavingRef.current) return;
      // Memes textes (deja traduits) que ideal-day et la carte du planning.
      const outcome = await maybePrimePushPermission({
        title: t('pushPrimingTitle', undefined, 'Autoriser les rappels ?'),
        message: t(
          'pushPrimingMessage',
          undefined,
          "Sans notification, l'app ne peut rien te rappeler : ni ta session du matin, ni ce que tu as prévu de réviser. Tu règles la fréquence, et tu peux tout couper dans les réglages."
        ),
        later: t('pushPrimingLater', undefined, 'Plus tard'),
        enable: t('pushPrimingEnable', undefined, 'Activer'),
      });
      // Permission donnee : les rappels et le calendrier « Productif » se
      // programment tout de suite, sans attendre l'accueil. Jamais attendu.
      if (outcome === 'granted') void syncStudyPlan(studyCopy, { force: true }).catch(() => {});
    }, PUSH_PRIMING_DELAY_MS);
    return () => clearTimeout(timer);
    // Une seule fois, a l'arrivee.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => summarizePlan(blocks ?? [], now), [blocks, now]);
  const days = useMemo(() => groupBlocksByDay(blocks ?? [], now, 14), [blocks, now]);
  const insights = useMemo(() => (answers ? planInsights(answers, summary) : []), [answers, summary]);
  const busySlots = getLastAppleBusySlots();
  const classesEndHour = draft?.classesEndHour ?? null;
  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';

  const dayTitle = (offset: number, date: Date) => {
    // Cles deja traduites de la carte du planning (StudyPlanCard).
    if (offset === 0) return t('studyPlanToday', undefined, "Aujourd'hui");
    if (offset === 1) return t('studyPlanTomorrow', undefined, 'Demain');
    const label = date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const handleContinue = () => {
    leavingRef.current = true;
    trackStepCompleted('planning', {
      sessions: summary.sessions,
      subjects: summary.subjects,
      insights: insights.length,
      empty: summary.sessions === 0,
    });
    router.push('/(onboarding-new)/trial');
  };

  const loading = blocks === null;
  const empty = !loading && summary.sessions === 0;
  const hasDraftSubjects = (draft?.subjects.length ?? 0) > 0;

  const subtitle = (() => {
    if (loading) return null;
    if (empty) {
      return hasDraftSubjects
        ? t(
            'onbPlanEmptyPending',
            undefined,
            "Aucune séance n'est encore placée. Dès que le calcul aura fini, elles apparaîtront dans ton accueil."
          )
        : t(
            'onbPlanEmptyNoSubject',
            undefined,
            "Ajoute tes matières depuis ton accueil : l'app placera tes séances autour de tes cours."
          );
    }
    return summary.sessions === 1
      ? t('onbPlanSummaryOne', { minutes: summary.typicalMinutes }, '1 séance de {minutes} min sur les 14 prochains jours.')
      : t(
          'onbPlanSummaryMany',
          { count: summary.sessions, minutes: summary.typicalMinutes },
          '{count} séances de {minutes} min sur les 14 prochains jours.'
        );
  })();

  return (
    <OnboardingScreen
      footer={<PrimaryButton label={t('continue') || 'Continuer'} onPress={handleContinue} disabled={loading} />}
    >
      <Animated.View entering={FadeIn.delay(100).duration(400)}>
        <Text style={onboardingText.title}>
          {empty
            ? t('onbPlanTitleEmpty', undefined, 'Ton planning est presque prêt')
            : t('onbPlanTitle', undefined, 'Ton planning est prêt')}
        </Text>
        {subtitle ? <Text style={onboardingText.subtitle}>{subtitle}</Text> : null}
      </Animated.View>

      {loading ? <ActivityIndicator size="large" color={ONBOARDING_GREEN} style={styles.loader} /> : null}

      {insights.length > 0 && !empty ? (
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.insights}>
          {insights.map((copy) => (
            <View key={copy.key} style={styles.insightRow}>
              <Ionicons name="checkmark-circle" size={18} color={ONBOARDING_GREEN} style={styles.insightIcon} />
              <Text style={styles.insightText}>{renderCopy(t, copy)}</Text>
            </View>
          ))}
        </Animated.View>
      ) : null}

      {!loading && !empty ? (
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <View style={styles.legend}>
            <Ionicons name="lock-closed" size={14} color="rgba(0, 0, 0, 0.55)" />
            <Text style={styles.legendText}>
              {t(
                'onbPlanLockLegend',
                undefined,
                'Avec Premium, tes applis se verrouillent toutes seules pendant chaque séance.'
              )}
            </Text>
          </View>

          {days.map((day) => {
            const busy = busyLineForDay(day.date, { slots: busySlots, classesEndHour });
            return (
              <View key={day.ymd} style={styles.day}>
                <Text style={styles.dayTitle}>{dayTitle(day.offset, day.date)}</Text>
                {busy ? (
                  <View style={styles.busyRow}>
                    <Ionicons name="school-outline" size={14} color="rgba(0, 0, 0, 0.4)" />
                    <Text style={styles.busyText}>{renderCopy(t, busy)}</Text>
                  </View>
                ) : null}
                {day.blocks.map((block) => (
                  <View key={`${block.taskId}@${block.start}`} style={styles.blockRow}>
                    <Text style={styles.blockTime}>{formatHour(new Date(block.start))}</Text>
                    <View style={styles.blockBody}>
                      <Text style={styles.blockTitle} numberOfLines={2}>
                        {blockLabel(block)}
                      </Text>
                      <Text style={styles.blockMeta}>
                        {t('onbPlanMinutes', { minutes: block.minutes }, '{minutes} min')}
                      </Text>
                    </View>
                    <View style={styles.lockPill}>
                      <Ionicons name="lock-closed" size={12} color={ONBOARDING_GREEN} />
                      <Text style={styles.lockPillText}>{t('onbPlanWithPremium', undefined, 'avec Premium')}</Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </Animated.View>
      ) : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 32,
  },
  insights: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    gap: 10,
    marginBottom: 24,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: '#0F5132',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  legendText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(0, 0, 0, 0.55)',
  },
  day: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    paddingLeft: 4,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    marginBottom: 8,
  },
  busyText: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.45)',
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: 8,
    gap: 12,
  },
  blockTime: {
    width: 48,
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  blockBody: {
    flex: 1,
  },
  blockTitle: {
    fontSize: 15,
    color: '#000000',
  },
  blockMeta: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.45)',
    marginTop: 2,
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
  },
  lockPillText: {
    fontSize: 12,
    color: ONBOARDING_GREEN,
    fontWeight: '500',
  },
});
