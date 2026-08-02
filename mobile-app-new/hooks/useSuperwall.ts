import { usePlacement } from 'expo-superwall';
import { logSubscriptionEvent } from '@/lib/appsflyerEvents';
import { checkPremiumStatus } from '@/utils/premium';
import { SUPERWALL_EVENTS, SuperwallEventName } from '@/lib/superwallEvents';
import { getActiveExamSession, isDemoSession } from '@/utils/examSession';

const DEFAULT_COOLDOWN_MS = 60_000;
/**
 * Fenêtre pendant laquelle on refuse d'enchaîner un paywall juste après qu'un
 * autre vient de se fermer. Sans elle, fermer le paywall de fin d'onboarding
 * puis atterrir sur les onglets (qui déclenchent leurs propres placements au
 * montage) en réaffichait un immédiatement, et le SDK renvoyait
 * "You can only present one paywall at a time".
 * Ne s'applique pas aux CTA explicites (bypassCooldown), qui doivent toujours
 * répondre au tap de l'utilisateur.
 */
const POST_DISMISS_GRACE_MS = 1_500;

let lastTriggerAt = 0;
let lastPlacement: string | null = null;
/** Partagé entre toutes les instances du hook : un seul paywall à la fois. */
let isPresenting = false;
let lastFinishedAt = 0;

interface TriggerEventOptions {
  params?: Record<string, any>;
  feature?: () => void;
  cooldownMs?: number;
  bypassCooldown?: boolean;
  requireNonPremium?: boolean;
  /** Par défaut false : si une session mode examen est active, on n’affiche pas le paywall feature_locked. */
  forcePaywallInExamMode?: boolean;
}

export function useSuperwall() {
  const { registerPlacement, state } = usePlacement({
    onError: (err) => console.error('[Superwall] Placement error:', err),
    onPresent: (info) => console.log('[Superwall] Paywall presented:', info),
    onDismiss: (info, result) => {
      console.log('[Superwall] Paywall dismissed:', info, 'Result:', result);
      // PaywallResult est une union discriminée : il faut tester result.type.
      // L'ancien test `result === 'purchased'` était toujours faux, donc aucun
      // achat n'était jamais remonté à AppsFlyer.
      if (result?.type === 'purchased' || result?.type === 'restored') {
        logSubscriptionEvent({
          productId: result.type === 'purchased' ? result.productId : undefined,
        });
      }
    },
  });

  const triggerEvent = async (
    placement: SuperwallEventName,
    options: TriggerEventOptions = {},
  ) => {
    const {
      params,
      feature,
      cooldownMs = DEFAULT_COOLDOWN_MS,
      bypassCooldown = false,
      requireNonPremium = true,
      forcePaywallInExamMode = false,
    } = options;

    if (requireNonPremium) {
      const premiumStatus = await checkPremiumStatus();
      if (premiumStatus.isPremium) {
        console.log(`[Superwall] ${placement} ignoré : utilisateur déjà premium`);
        return { shown: false, reason: 'premium_user' as const };
      }
    }

    if (
      placement === SUPERWALL_EVENTS.FEATURE_LOCKED &&
      !forcePaywallInExamMode
    ) {
      // Ne vaut que pour une vraie session (premium) qu'on ne veut pas
      // interrompre. Une session de démo ne doit pas désactiver le paywall :
      // c'est justement le paywall qu'on veut lui présenter.
      const examSession = await getActiveExamSession();
      if (examSession && !isDemoSession(examSession)) {
        console.log(`[Superwall] ${placement} ignoré : session mode examen en cours`);
        return { shown: false, reason: 'exam_mode_active' as const };
      }
    }

    // Garde absolue : le SDK refuse deux présentations simultanées.
    if (isPresenting) {
      console.log(`[Superwall] ${placement} ignoré : un paywall est déjà à l'écran`);
      return { shown: false, reason: 'already_presenting' as const };
    }

    const now = Date.now();

    if (!bypassCooldown && now - lastFinishedAt < POST_DISMISS_GRACE_MS) {
      console.log(`[Superwall] ${placement} ignoré : un paywall vient de se fermer`);
      return { shown: false, reason: 'post_dismiss_grace' as const };
    }

    if (
      !bypassCooldown &&
      now - lastTriggerAt < cooldownMs &&
      lastPlacement === placement
    ) {
      console.log(`[Superwall] ${placement} ignoré : cooldown de ${cooldownMs}ms`);
      return { shown: false, reason: 'cooldown' as const };
    }

    isPresenting = true;
    lastTriggerAt = now;
    lastPlacement = placement;
    try {
      await registerPlacement({ placement, params, feature });
    } finally {
      // Libéré dans un finally et jamais uniquement dans onDismiss : si aucun
      // paywall ne s'affiche (aucune règle Superwall ne correspond), onDismiss
      // ne se déclenche pas et le verrou resterait fermé pour toute la session.
      isPresenting = false;
      lastFinishedAt = Date.now();
    }
    return { shown: true, reason: 'presented' as const };
  };

  const showPaywall = async (
    placement: SuperwallEventName,
    params?: Record<string, any>,
    feature?: () => void,
  ) => {
    await triggerEvent(placement, { params, feature });
  };

  return { showPaywall, triggerEvent, paywallState: state };
}
