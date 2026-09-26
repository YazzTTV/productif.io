import { useSuperwallStore, SuperwallExpoModule, type SuperwallStore } from 'expo-superwall';
import { authService, getAuthToken, type User } from '@/lib/api';
import {
  decideExamAccess,
  isServerPremium,
  NO_EXAM_ACCESS,
  type ExamAccess,
} from '@/utils/examAccessRules';

// Les regles pures vivent dans examAccessRules.ts (testables sans telephone) ;
// reexportees ici pour que les ecrans n'aient qu'un point d'entree.
export { FREE_SESSION_CANCEL_GRACE_SECONDS, type ExamAccess } from '@/utils/examAccessRules';

export interface PremiumStatus {
  isPremium: boolean;
  plan?: 'annual' | 'monthly' | 'free';
}

export async function checkPremiumStatus(): Promise<PremiumStatus> {
  try {
    // Récupérer le statut depuis l'API (source de vérité)
    const user = await authService.checkAuth();

    if (user) {
      return {
        isPremium: user.isPremium || false,
        plan: user.plan === 'premium' ? 'annual' : 'free', // Simplification, on pourrait récupérer le type exact
      };
    }

    // Si l'utilisateur n'est pas authentifié, retourner le statut par défaut
    // Ne pas essayer trial-status car cela nécessite aussi une authentification
    console.log('ℹ️ Utilisateur non authentifié, statut par défaut: free');
    return { isPremium: false, plan: 'free' };
  } catch (error) {
    console.error('Error checking premium status:', error);
    return { isPremium: false, plan: 'free' };
  }
}

/**
 * GET /api/auth/me renvoie le nombre de seances Mode Examen offertes restantes
 * depuis la 1.5 (null pour un premium). Declare ici plutot que dans `User` : le
 * champ n'a de sens que pour le controle d'acces du Mode Examen.
 */
type UserWithExamQuota = User & { examFreeRemaining?: number | null };

/**
 * Attend la configuration du SDK Superwall, au plus `ms`.
 *
 * Au demarrage a froid, le store Superwall vaut `UNKNOWN` tant que `configure`
 * n'a pas repondu. Lu trop tot, un abonne dont le webhook n'est pas encore
 * passe serait pris pour un gratuit, et sa session en cours effacee.
 */
function waitForSuperwallConfigured(ms: number): Promise<SuperwallStore> {
  return new Promise((resolve) => {
    const initial = useSuperwallStore.getState();
    if (initial.isConfigured || initial.configurationError || ms <= 0) {
      resolve(initial);
      return;
    }
    let unsubscribe: () => void = () => {};
    const timer = setTimeout(() => {
      unsubscribe();
      resolve(useSuperwallStore.getState());
    }, ms);
    unsubscribe = useSuperwallStore.subscribe((state) => {
      if (state.isConfigured || state.configurationError) {
        clearTimeout(timer);
        unsubscribe();
        resolve(state);
      }
    });
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

/**
 * L'abonnement est actif selon StoreKit, tel que Superwall le lit.
 *
 * C'est le repli du delai de webhook (le serveur n'apprend l'achat qu'apres
 * quelques secondes, parfois plus) et de la restauration, qui ne produit AUCUN
 * evenement webhook : sans lui, quelqu'un qui restaure son achat restait gratuit
 * dans l'app.
 *
 * Limite a connaitre : StoreKit raisonne par identifiant Apple et non par
 * compte productif. Deux comptes productif sur le meme iPhone partagent donc ce
 * signal. C'est le modele d'Apple, et c'est pour ca que ce n'est qu'un repli :
 * le serveur reste la source de verite des que le webhook est passe.
 */
export async function readStoreSubscriptionActive(options: { waitMs?: number } = {}): Promise<boolean> {
  try {
    const state = await waitForSuperwallConfigured(options.waitMs ?? 1500);
    if (!state.isConfigured) return false;
    let status = state.subscriptionStatus?.status;
    if (!status || status === 'UNKNOWN') {
      const fresh = await withTimeout(SuperwallExpoModule.getSubscriptionStatus(), 1500);
      status = fresh?.status;
    }
    return status === 'ACTIVE';
  } catch (error) {
    console.warn('[premium] statut StoreKit illisible', error);
    return false;
  }
}

/**
 * Tout ce qu'il faut savoir pour ouvrir le Mode Examen : premium, seances
 * offertes restantes, et droit de lancer une seance maintenant.
 *
 * Fail-closed sur le serveur : un compte dont le serveur ne dit rien n'a pas de
 * seance offerte. Le seul signal accepte hors serveur est l'abonnement StoreKit,
 * qui est une preuve d'achat et non une supposition.
 */
export async function getExamAccess(
  options: { force?: boolean; storeWaitMs?: number } = {},
): Promise<ExamAccess> {
  try {
    const hasToken = !!(await getAuthToken());
    if (!hasToken) return NO_EXAM_ACCESS;

    const user = (await authService.checkAuth(options.force ? { force: true } : undefined)) as
      | UserWithExamQuota
      | null;

    // StoreKit n'est interroge que si le serveur ne dit pas deja premium : c'est
    // le cas courant d'un abonne, inutile de l'attendre. Il l'est aussi quand
    // /auth/me a echoue (reseau HS), cas ou un abonne perdait sa session en
    // cours au demarrage a froid.
    const storeActive = isServerPremium(user)
      ? false
      : await readStoreSubscriptionActive({ waitMs: options.storeWaitMs });

    return decideExamAccess({ hasToken, user, storeActive });
  } catch (error) {
    console.error('Error checking exam access:', error);
    return NO_EXAM_ACCESS;
  }
}

/**
 * Accès PREMIUM au Mode Examen (illimité, blocage automatique).
 *
 * Fail-closed : toute incertitude (non authentifié, réseau HS, réponse
 * dégradée, exception) refuse l'accès, sauf un abonnement StoreKit actif. Ne
 * jamais dériver ce droit de la présence d'une session examen en stockage
 * local, qui est falsifiable.
 *
 * Ne couvre PAS les séances offertes d'un compte gratuit : pour savoir si une
 * séance peut être lancée, utiliser `getExamAccess().canStart`.
 */
export async function hasExamModeAccess(
  options: { force?: boolean; storeWaitMs?: number } = {},
): Promise<boolean> {
  return (await getExamAccess(options)).premium;
}

/** « Il te reste 2 séances offertes », accordé au nombre. */
export function freeSessionsLeftLabel(
  t: (key: string, params?: Record<string, string | number>, fallback?: string) => string,
  count: number,
): string {
  if (count <= 0) return t('examFreeNoneLeft', undefined, 'Tes séances offertes sont utilisées.');
  if (count === 1) return t('examFreeOneLeft', undefined, 'Il te reste 1 séance offerte.');
  return t('examFreeManyLeft', { count }, 'Il te reste {count} séances offertes.');
}

export async function setPremiumStatus(plan: 'annual' | 'monthly' | 'free'): Promise<void> {
  try {
    await AsyncStorage.setItem(SELECTED_PLAN_KEY, plan);
    await AsyncStorage.setItem(PREMIUM_KEY, plan !== 'free' ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting premium status:', error);
  }
}
