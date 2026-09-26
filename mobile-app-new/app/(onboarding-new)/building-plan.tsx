import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { onboardingService, type StudyBlock } from '@/lib/api';
import { buildOnboardingPlanRequest, useOnboardingDraft } from '@/lib/onboardingDraft';
import { trackOnboardingEvent, trackStepCompleted, useOnboardingStep } from '@/lib/onboardingTracking';
import { loadPlanBlocks, rememberPlanBlocks } from '@/lib/onboardingFlow';
import { isPlanTimeout } from '@/lib/onboardingPlanView';
import { parseLocalYmd, sanitizeExamDate } from '@/lib/onboardingLogic';
import {
  ONBOARDING_GREEN,
  OnboardingScreen,
  PrimaryButton,
  SecondaryButton,
  onboardingText,
} from '@/components/onboarding/OnboardingUI';

/**
 * Ecran de calcul (spec 1.5, ecran 8). Il remplace la minuterie qui simulait un
 * calcul : cet ecran FAIT le calcul, par POST /api/onboarding/plan, qui cree
 * matieres et chapitres puis place les seances.
 *
 * Les delais, et pourquoi :
 *   - 20 s au plus cote app. Le serveur borne son calcul rapide (sans Google) a
 *     3 s et fait le calcul complet apres sa reponse (after()), donc au-dela
 *     c'est le reseau qui manque, pas le calcul ;
 *   - `partial` sans aucun bloc : le calcul rapide n'a pas fini, le complet
 *     tourne encore sur le serveur. On relit GET /api/planning/blocks quelques
 *     secondes avant d'avancer, sinon l'ecran du planning s'afficherait vide
 *     alors que les seances arrivent ;
 *   - echec ou delai : repli HONNETE. GET /api/planning/blocks ne calcule rien,
 *     il lit ce qui existe (critique de la spec, point 6). On dit donc ce qu'on
 *     montre, et on propose de reessayer : la cle d'idempotence du brouillon
 *     garantit qu'un second envoi ne cree pas les matieres en double.
 *
 * `onboarding_plan_built {ms, timeout, blocks}` part a chaque tentative : le
 * seuil de la spec est « moins de 10 % de depassements de delai ».
 */

const PLAN_TIMEOUT_MS = 20_000;
const PARTIAL_POLL_STEP_MS = 2_000;
const PARTIAL_POLL_MAX_MS = 8_000;
/** Au-dela, on le dit : rien n'est pire qu'une roue qui tourne sans explication. */
const SLOW_HINT_MS = 8_000;

type Phase = { kind: 'computing' } | { kind: 'fallback'; blocks: number } | { kind: 'failed' };

function errorLabel(error: unknown): string {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' ? `http_${status}` : 'network';
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function BuildingPlanScreen() {
  const { t, language } = useLanguage();
  const { draft } = useOnboardingDraft();
  const [phase, setPhase] = useState<Phase>({ kind: 'computing' });
  const [slow, setSlow] = useState(false);
  const aliveRef = useRef(true);
  const runningRef = useRef(false);
  const attemptRef = useRef(0);

  useOnboardingStep('building-plan');

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /** Relit les blocs tant que le calcul complet du serveur n'a rien ecrit, jusqu'a `deadline`. */
  const waitForBlocks = useCallback(async (deadline: number): Promise<StudyBlock[]> => {
    while (aliveRef.current && Date.now() + PARTIAL_POLL_STEP_MS <= deadline) {
      await sleep(PARTIAL_POLL_STEP_MS);
      const fresh = await loadPlanBlocks({ force: true });
      if (fresh && fresh.length > 0) return fresh;
    }
    return [];
  }, []);

  const run = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    attemptRef.current += 1;
    setPhase({ kind: 'computing' });
    setSlow(false);
    const started = Date.now();
    const slowTimer = setTimeout(() => {
      if (aliveRef.current) setSlow(true);
    }, SLOW_HINT_MS);

    try {
      const request = await buildOnboardingPlanRequest();
      try {
        const response = await onboardingService.buildPlan(request, PLAN_TIMEOUT_MS);
        const partial = response?.partial === true;
        let blocks: StudyBlock[] = Array.isArray(response?.blocks) ? response.blocks : [];
        if (partial && blocks.length === 0 && request.subjects.length > 0) {
          blocks = await waitForBlocks(Math.min(started + PLAN_TIMEOUT_MS, Date.now() + PARTIAL_POLL_MAX_MS));
        }
        rememberPlanBlocks(blocks);
        trackOnboardingEvent('onboarding_plan_built', {
          ms: Date.now() - started,
          timeout: false,
          blocks: blocks.length,
          partial,
          fallback: false,
          subjects: request.subjects.length,
          attempt: attemptRef.current,
        });
        trackStepCompleted('building-plan', { outcome: 'built', blocks: blocks.length, partial });
        if (aliveRef.current) router.replace('/(onboarding-new)/planning');
      } catch (error) {
        const ms = Date.now() - started;
        const timeout = isPlanTimeout(error, ms, PLAN_TIMEOUT_MS);
        console.warn('[Onboarding] calcul du planning en echec', error);
        // Ce qui existe deja cote serveur, sans rien calculer.
        const existing = await loadPlanBlocks({ force: true });
        trackOnboardingEvent('onboarding_plan_built', {
          ms,
          timeout,
          blocks: existing?.length ?? 0,
          partial: true,
          fallback: true,
          error: timeout ? 'timeout' : errorLabel(error),
          subjects: request.subjects.length,
          attempt: attemptRef.current,
        });
        if (!aliveRef.current) return;
        setPhase(existing && existing.length > 0 ? { kind: 'fallback', blocks: existing.length } : { kind: 'failed' });
      }
    } finally {
      clearTimeout(slowTimer);
      runningRef.current = false;
    }
  }, [waitForBlocks]);

  useEffect(() => {
    void run();
  }, [run]);

  const continueAnyway = (outcome: 'fallback' | 'failed') => {
    trackStepCompleted('building-plan', { outcome });
    router.replace('/(onboarding-new)/planning');
  };

  // Ce que le calcul utilise, pour que l'attente ait un contenu reel.
  const subjectCount = draft?.subjects.length ?? 0;
  // Meme nettoyage que la requete : une date passee part en « je ne sais pas ».
  const examDate = draft && !draft.examDateUnknown ? parseLocalYmd(sanitizeExamDate(draft.examDate)) : null;
  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';
  const facts = (() => {
    if (!draft) return null;
    if (subjectCount === 0) {
      return t('onbBuildFactsNoSubject', undefined, 'Sans matière pour le moment : tu pourras les ajouter depuis ton accueil.');
    }
    const subjects =
      subjectCount === 1
        ? t('onbBuildFactsOneSubject', undefined, '1 matière')
        : t('onbBuildFactsSubjects', { count: subjectCount }, '{count} matières');
    if (examDate) {
      const date = examDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
      return t('onbBuildFactsWithDate', { subjects, date }, '{subjects}, examens le {date}, autour de tes cours.');
    }
    return t('onbBuildFactsNoDate', { subjects }, '{subjects}, autour de tes cours.');
  })();

  if (phase.kind === 'computing') {
    return (
      <OnboardingScreen centered>
        <Animated.View entering={FadeIn.duration(250)} style={styles.center}>
          <ActivityIndicator size="large" color={ONBOARDING_GREEN} style={styles.spinner} />
          <Text style={onboardingText.title}>{t('onbBuildTitle', undefined, 'Ton planning se calcule…')}</Text>
          {facts ? <Text style={[onboardingText.subtitle, styles.facts]}>{facts}</Text> : null}
          {slow ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text style={onboardingText.help}>
                {t('onbBuildSlow', undefined, "Ça prend un peu plus longtemps que d'habitude. Encore quelques secondes.")}
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>
      </OnboardingScreen>
    );
  }

  if (phase.kind === 'fallback') {
    return (
      <OnboardingScreen
        centered
        footer={
          <>
            <PrimaryButton
              label={t('onbBuildSeePlan', undefined, 'Voir mon planning')}
              onPress={() => continueAnyway('fallback')}
            />
            <SecondaryButton label={t('onbBuildRetry', undefined, 'Réessayer le calcul')} onPress={() => void run()} />
          </>
        }
      >
        <Animated.View entering={FadeIn.duration(250)} style={styles.center}>
          <View style={styles.icon}>
            <Ionicons name="time-outline" size={32} color={ONBOARDING_GREEN} />
          </View>
          <Text style={onboardingText.title}>{t('onbBuildFallbackTitle', undefined, 'Le calcul prend plus de temps que prévu')}</Text>
          <Text style={onboardingText.subtitle}>
            {phase.blocks === 1
              ? t(
                  'onbBuildFallbackOne',
                  undefined,
                  "1 séance est déjà placée, c'est elle que tu vas voir. Le reste arrivera dans ton accueil dès que le calcul sera terminé."
                )
              : t(
                  'onbBuildFallbackMany',
                  { count: phase.blocks },
                  "{count} séances sont déjà placées, ce sont elles que tu vas voir. Le reste arrivera dans ton accueil dès que le calcul sera terminé."
                )}
          </Text>
        </Animated.View>
      </OnboardingScreen>
    );
  }

  return (
    <OnboardingScreen
      centered
      footer={
        <>
          <PrimaryButton label={t('onbBuildRetry', undefined, 'Réessayer le calcul')} onPress={() => void run()} />
          <SecondaryButton label={t('onbBuildContinue', undefined, 'Continuer sans attendre')} onPress={() => continueAnyway('failed')} />
        </>
      }
    >
      <Animated.View entering={FadeIn.duration(250)} style={styles.center}>
        <View style={styles.icon}>
          <Ionicons name="cloud-offline-outline" size={32} color={ONBOARDING_GREEN} />
        </View>
        <Text style={onboardingText.title}>{t('onbBuildFailedTitle', undefined, "Ton planning n'a pas pu être calculé")}</Text>
        <Text style={onboardingText.subtitle}>
          {t(
            'onbBuildFailedText',
            undefined,
            "La connexion au serveur a échoué. Tes réponses sont gardées sur ton téléphone : relance le calcul, rien ne sera créé en double."
          )}
        </Text>
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 28,
  },
  facts: {
    marginBottom: 16,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
});
