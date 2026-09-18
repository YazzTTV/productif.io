import { usePlacement } from 'expo-superwall';
import { logSubscriptionEvent } from '@/lib/appsflyerEvents';
import { invalidateAuthCache } from '@/lib/api';
import { checkPremiumStatus } from '@/utils/premium';
import { SUPERWALL_EVENTS, SuperwallEventName } from '@/lib/superwallEvents';
import { getActiveExamSession, isDemoSession } from '@/utils/examSession';
import { trackEvent } from '@/lib/analytics';
import { trackBackendProductEvent } from '@/lib/productEvents';

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

/**
 * Au-dela de ce delai, on cesse d'attendre `registerPlacement` et on rend la
 * main a l'appelant.
 *
 * CE N'EST PAS UNE PRECAUTION THEORIQUE, c'est le seul remede possible. La
 * promesse de `registerPlacement` ne se REGLE PAS dans plusieurs cas reels, et
 * une promesse pendante n'est rattrapable ni par un `catch` ni par un
 * `finally` : les deux supposent qu'elle se regle.
 *
 * Chaine verifiee dans le code du SDK present sur le disque :
 *   - `node_modules/expo-superwall/ios/SuperwallExpoModule.swift` : le
 *     `promise.resolve(nil)` vit UNIQUEMENT dans le bloc de completion de
 *     `Superwall.shared.register`, et il n'existe aucun `promise.reject` sur ce
 *     point d'entree.
 *   - `ios/Pods/SuperwallKit/.../Paywall/Presentation/PublicPresentation.swift` :
 *     `.purchased` et `.restored` appellent `completion?()`, `.skipped` aussi,
 *     `.declined` seulement si `closeReason != .forNextPaywall` ET
 *     `featureGating == .nonGated`, et surtout `.presentationError` n'appelle
 *     RIEN, avec ce commentaire du SDK lui-meme : "otherwise turning internet
 *     off would give unlimited access".
 *
 * Donc reseau coupe pendant l'onboarding = promesse jamais reglee = l'appelant
 * attend pour toujours. C'est ce qui bloquait l'utilisateur sur le dernier ecran
 * de l'onboarding avec les deux boutons desactives, sans paywall a l'ecran et
 * sans autre issue que tuer l'application.
 *
 * 8 secondes laissent largement le temps a un paywall de s'afficher. Passe ce
 * delai on navigue, et le paywall natif reste presente PAR-DESSUS : l'utilisateur
 * ne voit aucune difference, il retombe simplement dans l'app en le fermant.
 */
const PRESENTATION_TIMEOUT_MS = 8_000;
/**
 * Peremption du verrou global. Ceinture et bretelles : meme si un chemin non
 * prevu laissait `isPresenting` a true, il ne peut plus eteindre les paywalls de
 * toute la session.
 */
const PRESENTING_LOCK_MAX_MS = 60_000;

let lastTriggerAt = 0;
let lastPlacement: string | null = null;
/** Partagé entre toutes les instances du hook : un seul paywall à la fois. */
let isPresenting = false;
/** Horodatage de la prise du verrou, pour pouvoir le considerer perime. */
let isPresentingSince = 0;
let lastFinishedAt = 0;

type SuperwallParams = Record<string, string | number | boolean | null | undefined>;

interface TriggerEventOptions {
  params?: SuperwallParams;
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
    onPresent: (info) => {
      console.log('[Superwall] Paywall presented:', info);
      void trackEvent('paywall_viewed', { placement: lastPlacement });
      void trackBackendProductEvent('paywall_viewed', { placement: lastPlacement });
    },
    onDismiss: (info, result) => {
      console.log('[Superwall] Paywall dismissed:', info, 'Result:', result);
      const dismissParams = {
        placement: lastPlacement,
        result: result?.type ?? 'unknown',
      };
      void trackEvent('paywall_dismissed', dismissParams);
      void trackBackendProductEvent('paywall_dismissed', dismissParams);
      // PaywallResult est une union discriminée : il faut tester result.type.
      // L'ancien test `result === 'purchased'` était toujours faux, donc aucun
      // achat n'était jamais remonté à AppsFlyer.
      if (result?.type === 'purchased' || result?.type === 'restored') {
        // Le plan affiché vient de /auth/me, mis en cache 45 s. Sans cette
        // invalidation, l'app continue de se croire gratuite juste après un
        // achat : plan "Gratuit" dans les réglages et fonctionnalités encore
        // verrouillées jusqu'à expiration du cache.
        invalidateAuthCache();
        logSubscriptionEvent({
          productId: result.type === 'purchased' ? result.productId : undefined,
        });
        const purchaseEvent = result.type === 'purchased' ? 'purchase_completed' : 'purchase_restored';
        const purchaseParams = {
          placement: lastPlacement,
          product_id: result.type === 'purchased' ? result.productId : undefined,
        };
        void trackEvent(purchaseEvent, purchaseParams);
        void trackBackendProductEvent(purchaseEvent, purchaseParams);
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

    const now = Date.now();

    // Garde absolue : le SDK refuse deux présentations simultanées. Le verrou se
    // perime, pour qu'un chemin non prevu ne puisse jamais eteindre tous les
    // paywalls de l'app jusqu'au prochain lancement.
    if (isPresenting && now - isPresentingSince < PRESENTING_LOCK_MAX_MS) {
      console.log(`[Superwall] ${placement} ignoré : un paywall est déjà à l'écran`);
      return { shown: false, reason: 'already_presenting' as const };
    }
    if (isPresenting) {
      console.warn(`[Superwall] verrou périmé (> ${PRESENTING_LOCK_MAX_MS} ms), libéré de force`);
      isPresenting = false;
    }

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
    isPresentingSince = now;
    lastTriggerAt = now;
    lastPlacement = placement;

    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // La course est obligatoire : cf. PRESENTATION_TIMEOUT_MS ci-dessus, la
      // promesse de `registerPlacement` peut ne jamais se regler, et dans ce cas
      // ni le `catch` ni le `finally` ci-dessous ne seraient atteints sans elle.
      await Promise.race([
        registerPlacement({ placement, params, feature }),
        new Promise<void>((resolve) => {
          timer = setTimeout(() => {
            timedOut = true;
            resolve();
          }, PRESENTATION_TIMEOUT_MS);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      // Libéré dans un finally et jamais uniquement dans onDismiss : si aucun
      // paywall ne s'affiche (aucune règle Superwall ne correspond), onDismiss
      // ne se déclenche pas et le verrou resterait fermé pour toute la session.
      isPresenting = false;
      isPresentingSince = 0;
      lastFinishedAt = Date.now();
    }

    if (timedOut) {
      console.warn(`[Superwall] ${placement} : pas de réponse en ${PRESENTATION_TIMEOUT_MS} ms, on rend la main`);
      return { shown: false, reason: 'timeout' as const };
    }
    return { shown: true, reason: 'presented' as const };
  };

  const showPaywall = async (
    placement: SuperwallEventName,
    params?: SuperwallParams,
    feature?: () => void,
  ) => {
    await triggerEvent(placement, { params, feature });
  };

  return { showPaywall, triggerEvent, paywallState: state };
}
