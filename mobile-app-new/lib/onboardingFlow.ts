/**
 * Ce que les derniers ecrans de l'onboarding 1.5 partagent : les blocs du
 * planning calcule, l'identite Superwall avant le paywall, la relecture du
 * compte apres un achat, la reprise apres une app tuee, et la sortie.
 *
 * Parcours : building-plan (calcul) -> planning -> trial -> paywall, puis
 * premium-setup (achat) ou free-sessions (refus, « Plus tard »), puis l'accueil.
 * Les decisions pures (ou aller apres le paywall, quelle route reprendre) vivent
 * dans lib/onboardingPlanView.ts, testees sans telephone.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authService,
  onAuthTokenChange,
  onboardingService,
  studyPlanService,
  type StudyBlock,
  type User,
} from '@/lib/api';
import { clearOnboardingDraft, isOnboardingInProgress, loadOnboardingDraft } from '@/lib/onboardingDraft';
import { ONBOARDING_FLOW } from '@/lib/onboardingTracking';
import { resumeRouteFor } from '@/lib/onboardingPlanView';
import { trackEvent } from '@/lib/analytics';

/** Rend `fallback` si la promesse ne s'est pas reglee dans le delai, ou si elle echoue. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

// ---------------------------------------------------------------------------
// Blocs du planning
// ---------------------------------------------------------------------------

/**
 * Les blocs rendus par le calcul, passes a l'ecran suivant en memoire plutot
 * qu'en parametre de route (jusqu'a 14 jours de seances). Apres une app tuee,
 * la memoire est vide : les ecrans relisent GET /api/planning/blocks.
 */
let latest: { blocks: StudyBlock[]; at: number } | null = null;
const FRESH_MS = 10 * 60 * 1000;

onAuthTokenChange(() => {
  latest = null;
});

export function rememberPlanBlocks(blocks: StudyBlock[]): void {
  latest = { blocks, at: Date.now() };
}

/** Les blocs du calcul s'ils sont recents, sans reseau. */
export function peekPlanBlocks(): StudyBlock[] | null {
  if (!latest || Date.now() - latest.at > FRESH_MS) return null;
  return latest.blocks;
}

/**
 * Les blocs a afficher : ceux du calcul s'ils sont en memoire, sinon ceux du
 * serveur. null si le serveur n'a pas repondu (a distinguer d'un planning vide).
 */
export async function loadPlanBlocks(options: { force?: boolean } = {}): Promise<StudyBlock[] | null> {
  if (!options.force) {
    const cached = peekPlanBlocks();
    if (cached) return cached;
  }
  try {
    const response = await studyPlanService.getBlocks(14);
    const blocks = Array.isArray(response?.blocks) ? response.blocks : [];
    rememberPlanBlocks(blocks);
    return blocks;
  } catch (error) {
    console.warn('[onboardingFlow] lecture des blocs impossible', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Identite Superwall, avant le paywall
// ---------------------------------------------------------------------------

/** Au-dela, on presente le paywall quand meme : un paywall absent coute plus qu'un achat sous alias. */
const IDENTIFY_WAIT_MS = 5000;

export type IdentityCheck = 'already' | 'identified' | 'failed' | 'no_account';

/**
 * S'assure que Superwall connait le compte AVANT le paywall.
 *
 * hooks/useSuperwallUserSync.ts appelle identify a chaque connexion, mais en
 * arriere-plan, sans que personne ne l'attende. Un compte cree quelques minutes
 * plus tot pouvait donc atteindre le paywall encore sous l'alias anonyme, et
 * son achat arrivait au webhook sous cet alias (critique de la spec, point 8).
 * Ici on compare l'identifiant Superwall a celui du compte, et on ATTEND
 * identify s'ils different.
 *
 * `currentAppUserId` est lu par l'ecran dans useUser() au moment du tap.
 * Ne leve jamais.
 */
export async function ensureSuperwallIdentity(
  currentAppUserId: string | null | undefined,
  identify: (userId: string) => Promise<void>
): Promise<IdentityCheck> {
  const account = await authService.checkAuth().catch(() => null);
  if (!account?.id) return 'no_account';
  if (currentAppUserId === account.id) return 'already';
  const done = await withTimeout(
    identify(account.id).then(() => true),
    IDENTIFY_WAIT_MS,
    false
  );
  if (!done) console.warn('[onboardingFlow] identify Superwall non confirme avant le paywall');
  return done ? 'identified' : 'failed';
}

// ---------------------------------------------------------------------------
// Apres un achat
// ---------------------------------------------------------------------------

/** Premium selon le serveur, meme regle que isServerPremium (utils/examAccessRules.ts). */
function serverSaysPremium(user: User | null): boolean {
  if (!user) return false;
  if (user.planLimits) return user.planLimits.examModeEnabled === true;
  return user.isPremium === true;
}

/**
 * Relit le compte jusqu'a ce que le serveur voie l'abonnement, au plus
 * `maxMs`. Le webhook Superwall arrive souvent APRES la fermeture du paywall :
 * sans cette relecture, le cache de /auth/me (45 s) et le webhook en retard
 * laissaient l'app se croire gratuite juste apres l'achat, et la
 * synchronisation du planning refusait le blocage automatique (`not_premium`).
 * Renvoie vrai si le serveur a confirme ; faux n'empeche rien, le Mode Examen se
 * replie sur StoreKit (utils/premium.ts, readStoreSubscriptionActive).
 */
export async function waitForServerPremium(maxMs = 10_000, stepMs = 1_500): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  for (;;) {
    const user = await authService.checkAuth({ force: true }).catch(() => null);
    if (serverSaysPremium(user)) return true;
    const left = deadline - Date.now();
    if (left <= 0) return false;
    await new Promise((resolve) => setTimeout(resolve, Math.min(stepMs, left)));
  }
}

// ---------------------------------------------------------------------------
// Reprise apres une app tuee
// ---------------------------------------------------------------------------

/** Tous les ecrans du parcours sauf la connexion, qui precede le compte. */
const RESUMABLE_STEPS = (ONBOARDING_FLOW as readonly string[]).filter((step) => step !== 'connection');

/**
 * Route ou reprendre un onboarding interrompu, ou null. Lue par app/index.tsx
 * AVANT qu'il pose `onboarding_completed` : sans elle, une app tuee au milieu de
 * l'onboarding repartait sur l'accueil et l'etudiant ne voyait jamais le
 * paywall (spec 1.5, cas limites).
 *
 * Le drapeau `onboarding_in_progress` porte l'identifiant du compte : la reprise
 * ne vaut que pour lui. Dernier ecran inconnu (app tuee juste apres
 * l'inscription) : debut du questionnaire. Ne leve jamais.
 */
export async function resolveOnboardingResumeRoute(): Promise<string | null> {
  try {
    const inProgress = await isOnboardingInProgress();
    if (!inProgress) return null;
    const draft = await loadOnboardingDraft();
    return resumeRouteFor(true, draft.lastStep, RESUMABLE_STEPS);
  } catch (error) {
    console.warn('[onboardingFlow] reprise illisible', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sortie
// ---------------------------------------------------------------------------

/**
 * Fin de l'onboarding, par n'importe laquelle des sorties : l'app ne doit plus
 * y renvoyer. Pose `onboarding_completed`, retire le brouillon ET le drapeau
 * `onboarding_in_progress` (clearOnboardingDraft), sans quoi app/index.tsx
 * ramenerait l'etudiant sur le dernier ecran a chaque lancement.
 *
 * Ne leve jamais : entrer dans l'app est la promesse, rien ne doit l'empecher.
 * La navigation reste a l'appelant.
 */
export async function finishOnboardingFlow(nextAction: string): Promise<void> {
  try {
    await AsyncStorage.setItem('onboarding_completed', 'true');
  } catch (error) {
    console.warn('[onboardingFlow] drapeau de fin non ecrit', error);
  }
  await clearOnboardingDraft().catch(() => {});
  latest = null;
  // Meme marque que les anciennes sorties (ideal-day, calendar-sync) pour les
  // statistiques d'onboarding cote serveur. Jamais attendu : apiCall plafonne
  // a 30 s, et ce document est rejoue au prochain enregistrement d'onboarding.
  void onboardingService.saveOnboardingData({ completed: true }).catch(() => {});
  // Firebase seulement : `onboarding_completed` n'est pas dans la liste
  // blanche du serveur, l'entonnoir serveur se lit par onboarding_step_*.
  void trackEvent('onboarding_completed', { next_action: nextAction, flow: '1.5' }).catch(() => {});
}
