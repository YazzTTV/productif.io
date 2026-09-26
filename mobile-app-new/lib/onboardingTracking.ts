/**
 * Mesure de l'onboarding, ecran par ecran.
 *
 * Regle fixee le 25 septembre en gardant le questionnaire : si plus de 30 %
 * des 20 premiers comptes neufs abandonnent pendant le questionnaire, on le
 * raccourcit. Il faut donc `onboarding_step_viewed` sur CHAQUE ecran, et
 * `onboarding_step_completed` a la sortie, sinon on ne sait pas ou ils partent.
 *
 * Chaque evenement part a deux endroits, comme dans hooks/useSuperwall.ts :
 * Firebase (lib/analytics.ts) et la table product_analytics_events
 * (lib/productEvents.ts). Cette derniere filtre sur une liste blanche, cote
 * app ET cote serveur (app/api/user/product-events/route.ts) : un nom absent
 * d'une des deux listes est ignore sans bruit. Les noms de l'onboarding 1.5 y
 * sont depuis le lot 2.
 */

import { useEffect } from 'react';
import { getAuthToken, onAuthTokenChange } from '@/lib/api';
import { trackEvent, type ProductEvent } from '@/lib/analytics';
import { trackBackendProductEvent } from '@/lib/productEvents';
import { rememberOnboardingStep } from '@/lib/onboardingDraft';
import type { CalendarChoice } from '@/lib/onboardingLogic';

/**
 * Ordre du parcours 1.5. Le rang part avec chaque evenement : il permet de
 * lire l'entonnoir dans l'ordre sans connaitre les noms d'ecran. Un nom absent
 * de la liste part avec index -1, il n'est jamais rejete.
 *
 * Les deux derniers sont des branches et non des etapes successives : apres le
 * paywall, l'etudiant voit `premium-setup` (achat) OU `free-sessions` (refus,
 * ou « Plus tard »). Ils partagent donc le meme rang.
 */
export const ONBOARDING_FLOW = [
  'connection',
  'value-awareness',
  'identity',
  'goals-pressure',
  'academic-context',
  'daily-struggles',
  'work-style-diagnostic',
  'goals-intent',
  'tried-before',
  'exams',
  'subjects',
  'chapters',
  'courses',
  'building-plan',
  'planning',
  'trial',
  'premium-setup',
  'free-sessions',
] as const;

/** Les deux sorties du paywall ont le meme rang : ce sont deux branches. */
const BRANCH_RANK: Record<string, number> = {
  'free-sessions': ONBOARDING_FLOW.indexOf('premium-setup'),
};

export type OnboardingStep = (typeof ONBOARDING_FLOW)[number] | (string & {});

type OnboardingEventName =
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_calendar_choice'
  | 'onboarding_plan_built'
  | 'trial_cta_tapped'
  | 'paywall_skipped';

type Params = Record<string, string | number | boolean | null | undefined>;

// Une vue par ecran et par lancement de l'app : un aller-retour entre deux
// ecrans ne doit pas gonfler l'entonnoir. Meme chose pour la sortie.
const viewedThisRun = new Set<string>();
const completedThisRun = new Set<string>();
// Un autre compte qui s'inscrit sur le meme telephone, sans relancer l'app,
// repart d'un entonnoir vide.
onAuthTokenChange(() => {
  viewedThisRun.clear();
  completedThisRun.clear();
});

function stepIndex(step: string): number {
  if (step in BRANCH_RANK) return BRANCH_RANK[step];
  return (ONBOARDING_FLOW as readonly string[]).indexOf(step);
}

async function send(name: OnboardingEventName, params: Params) {
  const event: ProductEvent = name;
  void trackEvent(event, params);
  // Avant la connexion il n'y a pas de jeton : la route repondrait 401. On ne
  // tente meme pas, Firebase a deja l'evenement.
  const token = await getAuthToken().catch(() => null);
  if (!token) return;
  await trackBackendProductEvent(event, params);
}

export function trackStepViewed(step: OnboardingStep): void {
  if (viewedThisRun.has(step)) return;
  viewedThisRun.add(step);
  void send('onboarding_step_viewed', { step, index: stepIndex(step) }).catch(() => {});
}

export function trackStepCompleted(step: OnboardingStep, extra: Params = {}): void {
  if (completedThisRun.has(step)) return;
  completedThisRun.add(step);
  void send('onboarding_step_completed', { ...extra, step, index: stepIndex(step) }).catch(() => {});
}

/**
 * Choix d'agenda de l'ecran cours. `outcome` distingue un « rien » choisi d'un
 * « rien » subi (acces refuse, connexion Google echouee).
 */
export function trackCalendarChoice(
  choice: CalendarChoice,
  outcome: 'granted' | 'denied' | 'error' | 'skipped'
): void {
  void send('onboarding_calendar_choice', { choice, outcome }).catch(() => {});
}

/**
 * Evenements de la seconde moitie du parcours (calcul, essai, paywall). Ils ne
 * sont pas dedoublonnes : un « Reessayer » sur le calcul, ou un second tap sur
 * le bouton d'essai apres un paywall ferme, sont des evenements distincts.
 */
export function trackOnboardingEvent(
  name: 'onboarding_plan_built' | 'trial_cta_tapped' | 'paywall_skipped',
  params: Params = {}
): void {
  void send(name, params).catch(() => {});
}

/**
 * A appeler une fois en haut de chaque ecran d'onboarding : envoie la vue et
 * retient l'ecran pour la reprise apres une app tuee.
 */
export function useOnboardingStep(step: OnboardingStep): void {
  useEffect(() => {
    trackStepViewed(step);
    // L'ecran de connexion precede le compte : rien a reprendre.
    if (step !== 'connection') void rememberOnboardingStep(step);
  }, [step]);
}
