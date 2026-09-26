import { useEffect, useRef } from 'react';
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
 * Au-dela de ce delai SANS QUE LE PAYWALL SOIT APPARU, on cesse d'attendre
 * `registerPlacement` et on rend la main a l'appelant.
 *
 * Le delai ne couvre QUE l'apparition (jusqu'a `onPresent`). Des que le paywall
 * est a l'ecran, on attend sa fermeture (`onDismiss`) sans limite de temps.
 * Avant le 25 septembre il couvrait toute la vie du paywall : un etudiant qui
 * lisait l'offre plus de 8 s recevait `timeout`, l'ecran appelant continuait
 * sous le paywall, et un achat fait ensuite atterrissait sur l'ecran « refus »
 * de l'onboarding 1.5 (critique de la spec, point 1).
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
 * delai sans `onPresent`, on navigue : si un paywall finit quand meme par
 * s'afficher, il reste presente PAR-DESSUS et l'utilisateur retombe dans l'app
 * en le fermant.
 *
 * Et une fois `onPresent` recu, la promesse peut encore ne jamais se regler :
 * `.declined` n'appelle la completion qu'en mode non-gated. C'est pour ca que
 * l'attente apres apparition se termine sur `onDismiss`, et jamais sur la
 * promesse seule : si la promesse arrive la premiere, on laisse encore
 * DISMISS_EVENT_GRACE_MS a `onDismiss`, qui porte le resultat de l'achat.
 */
const PRESENTATION_TIMEOUT_MS = 8_000;
/**
 * Peremption du verrou global. Ceinture et bretelles : meme si un chemin non
 * prevu laissait `isPresenting` a true, il ne peut plus eteindre les paywalls de
 * toute la session.
 */
const PRESENTING_LOCK_MAX_MS = 60_000;
/**
 * Peremption du verrou quand le paywall est REELLEMENT a l'ecran (`onPresent`
 * recu, `onDismiss` pas encore). Plus longue : quelqu'un peut lire l'offre plus
 * d'une minute, et forcer le verrou pendant ce temps ferait tenter une seconde
 * presentation que le SDK refuse. Mais bornee quand meme, pour qu'un
 * `onDismiss` perdu ne puisse jamais eteindre les paywalls de toute la session.
 */
const ON_SCREEN_LOCK_MAX_MS = 15 * 60_000;
/**
 * Attente maximale de `onDismiss` quand la promesse s'est reglee la premiere.
 *
 * Cote natif (PublicPresentation.swift), le gestionnaire de fermeture est
 * appele AVANT la completion qui regle la promesse. Mais l'evenement et la
 * resolution traversent le pont par deux chemins distincts : rien ne garantit
 * qu'ils arrivent dans cet ordre. Sans cette attente, un achat pouvait etre lu
 * sans son resultat (`result: null`), et l'onboarding l'envoyait sur l'ecran
 * « refus ».
 */
const DISMISS_EVENT_GRACE_MS = 2_000;

let lastTriggerAt = 0;
let lastPlacement: string | null = null;
/** Partagé entre toutes les instances du hook : un seul paywall à la fois. */
let isPresenting = false;
/** Horodatage de la prise du verrou, pour pouvoir le considerer perime. */
let isPresentingSince = 0;
/** Vrai entre `onPresent` et la fin de l'attente : le paywall est a l'ecran. */
let isOnScreen = false;
/**
 * Proprietaire du verrou. Si un verrou perime est force par un second appel,
 * la fin du premier ne doit pas liberer celui du second.
 */
let presentingOwner = 0;
let presentationCounter = 0;
let lastFinishedAt = 0;

/** Ce que le paywall a rendu, quand il a ete ferme. */
export type PaywallOutcomeType = 'purchased' | 'restored' | 'declined';

export interface TriggerEventResult {
  /** Semantique historique : true des que `registerPlacement` a rendu la main. */
  shown: boolean;
  reason:
    | 'presented'
    | 'premium_user'
    | 'exam_mode_active'
    | 'already_presenting'
    | 'post_dismiss_grace'
    | 'cooldown'
    | 'timeout'
    | 'presentation_error';
  /**
   * Vrai seulement si `onPresent` a ete recu : un paywall s'est REELLEMENT
   * affiche. `reason: 'presented'` avec `presented: false` = placement absent du
   * tableau de bord, holdout ou audience non trouvee (le SDK rend la main sans
   * rien afficher).
   */
  presented: boolean;
  /** Resultat de `onDismiss`, null si le paywall n'a pas ete ferme (ou jamais affiche). */
  result: PaywallOutcomeType | null;
  /** Raison donnee par `onSkip`, quand le SDK l'a envoyee. */
  skippedReason: string | null;
}

/** Attente d'une presentation en cours, propre a une instance du hook (ses evenements lui sont reserves). */
interface PresentationWaiter {
  onPresent: () => void;
  onDismiss: (result: PaywallOutcomeType | null) => void;
  onSkip: (reason: string | null) => void;
  onError: () => void;
  abandon: () => void;
}

function notShown(reason: TriggerEventResult['reason']): TriggerEventResult {
  return { shown: false, reason, presented: false, result: null, skippedReason: null };
}

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
  // Les evenements de usePlacement sont reserves a CETTE instance (handlerId),
  // donc l'attente peut vivre dans une reference locale sans se melanger a
  // celle d'un autre ecran.
  const waiterRef = useRef<PresentationWaiter | null>(null);

  // Ecran demonte pendant l'attente : ses ecouteurs disparaissent avec lui, donc
  // `onDismiss` n'arrivera plus jamais ici. On libere l'attente, sinon le verrou
  // global resterait pris jusqu'a sa peremption.
  useEffect(() => () => waiterRef.current?.abandon(), []);

  const { registerPlacement, state } = usePlacement({
    onError: (err) => {
      console.error('[Superwall] Placement error:', err);
      waiterRef.current?.onError();
    },
    onSkip: (reason) => {
      waiterRef.current?.onSkip((reason as { type?: string } | undefined)?.type ?? null);
    },
    onPresent: (info) => {
      console.log('[Superwall] Paywall presented:', info);
      void trackEvent('paywall_viewed', { placement: lastPlacement });
      void trackBackendProductEvent('paywall_viewed', { placement: lastPlacement });
      waiterRef.current?.onPresent();
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
      const type = result?.type;
      waiterRef.current?.onDismiss(
        type === 'purchased' || type === 'restored' || type === 'declined' ? type : null,
      );
    },
  });

  const triggerEvent = async (
    placement: SuperwallEventName,
    options: TriggerEventOptions = {},
  ): Promise<TriggerEventResult> => {
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
        return notShown('premium_user');
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
        return notShown('exam_mode_active');
      }
    }

    const now = Date.now();

    // Garde absolue : le SDK refuse deux présentations simultanées. Le verrou se
    // perime, pour qu'un chemin non prevu ne puisse jamais eteindre tous les
    // paywalls de l'app jusqu'au prochain lancement. Paywall reellement a
    // l'ecran : peremption plus longue, quelqu'un peut lire l'offre longtemps.
    const lockMaxMs = isOnScreen ? ON_SCREEN_LOCK_MAX_MS : PRESENTING_LOCK_MAX_MS;
    if (isPresenting && now - isPresentingSince < lockMaxMs) {
      console.log(`[Superwall] ${placement} ignoré : un paywall est déjà à l'écran`);
      return notShown('already_presenting');
    }
    if (isPresenting) {
      console.warn(`[Superwall] verrou périmé (> ${lockMaxMs} ms), libéré de force`);
      isPresenting = false;
      isOnScreen = false;
    }

    if (!bypassCooldown && now - lastFinishedAt < POST_DISMISS_GRACE_MS) {
      console.log(`[Superwall] ${placement} ignoré : un paywall vient de se fermer`);
      return notShown('post_dismiss_grace');
    }

    if (
      !bypassCooldown &&
      now - lastTriggerAt < cooldownMs &&
      lastPlacement === placement
    ) {
      console.log(`[Superwall] ${placement} ignoré : cooldown de ${cooldownMs}ms`);
      return notShown('cooldown');
    }

    const owner = ++presentationCounter;
    presentingOwner = owner;
    isPresenting = true;
    isPresentingSince = now;
    isOnScreen = false;
    lastTriggerAt = now;
    lastPlacement = placement;

    let presented = false;
    let dismissed = false;
    let dismissResult: PaywallOutcomeType | null = null;
    let skippedReason: string | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    type Settled =
      | { kind: 'completed' }
      | { kind: 'dismissed' }
      | { kind: 'skipped' }
      | { kind: 'timeout' }
      | { kind: 'presentation_error' }
      | { kind: 'abandoned' }
      | { kind: 'error'; error: unknown };

    try {
      // Pas de Promise.race nu sur `registerPlacement` : sa promesse peut ne
      // jamais se regler (cf. PRESENTATION_TIMEOUT_MS), et un `await` dessus
      // n'atteindrait ni `catch` ni `finally`. On attend donc le PREMIER de ces
      // signaux : la promesse, `onDismiss`, `onSkip`, le delai d'apparition
      // (annule par `onPresent`), ou le demontage de l'ecran appelant.
      const settled = await new Promise<Settled>((resolve) => {
        let done = false;
        const settle = (value: Settled) => {
          if (done) return;
          done = true;
          if (timer) clearTimeout(timer);
          if (waiterRef.current === waiter) waiterRef.current = null;
          resolve(value);
        };
        const waiter: PresentationWaiter = {
          onPresent: () => {
            presented = true;
            // Le paywall est a l'ecran : plus de delai, on attend sa fermeture.
            if (timer) clearTimeout(timer);
            timer = undefined;
            if (presentingOwner === owner) {
              isOnScreen = true;
              isPresentingSince = Date.now();
            }
          },
          onDismiss: (result) => {
            dismissed = true;
            dismissResult = result;
            settle({ kind: 'dismissed' });
          },
          onSkip: (reason) => {
            skippedReason = reason;
            settle({ kind: 'skipped' });
          },
          // `.presentationError` (reseau coupe, paywall introuvable) : le SDK
          // n'appelle ni la completion ni `onPresent`, seulement `onError`. On
          // rend la main tout de suite au lieu d'attendre les 8 s du delai.
          // Jamais apres `onPresent` : l'erreur « webview gated » arrive apres
          // une fermeture, qui a deja regle l'attente. `onPaywallError` n'est
          // pas filtre par instance dans le SDK, mais un seul paywall peut etre
          // en cours a la fois (verrou global), donc l'erreur est la sienne.
          onError: () => {
            if (!presented) settle({ kind: 'presentation_error' });
          },
          abandon: () => settle({ kind: 'abandoned' }),
        };
        // Un appel precedent encore en attente sur cette instance (verrou force)
        // est libere : ses evenements arriveraient de toute facon ici.
        waiterRef.current?.abandon();
        waiterRef.current = waiter;

        timer = setTimeout(() => settle({ kind: 'timeout' }), PRESENTATION_TIMEOUT_MS);

        // `.then(ok, ko)` et non `await` : un rejet tardif, arrive apres
        // `onDismiss`, ne doit pas devenir une erreur non geree.
        registerPlacement({ placement, params, feature }).then(
          () => {
            // Paywall affiche mais `onDismiss` pas encore recu : il est en
            // route (cf. DISMISS_EVENT_GRACE_MS). On lui laisse un instant,
            // c'est lui qui porte le resultat de l'achat.
            if (presented && !dismissed) {
              if (timer) clearTimeout(timer);
              timer = setTimeout(() => settle({ kind: 'completed' }), DISMISS_EVENT_GRACE_MS);
              return;
            }
            settle({ kind: 'completed' });
          },
          (error) => settle({ kind: 'error', error }),
        );
      });

      if (settled.kind === 'error') {
        // Comportement d'avant conserve : l'erreur du SDK remonte a l'appelant,
        // qui l'enveloppe deja (cf. ideal-day, calendar-sync).
        throw settled.error;
      }

      if (settled.kind === 'timeout') {
        console.warn(`[Superwall] ${placement} : aucun paywall affiché en ${PRESENTATION_TIMEOUT_MS} ms, on rend la main`);
        return notShown('timeout');
      }

      if (settled.kind === 'presentation_error') {
        console.warn(`[Superwall] ${placement} : présentation impossible, on rend la main`);
        return notShown('presentation_error');
      }

      return {
        shown: true,
        reason: 'presented',
        presented,
        result: dismissResult,
        skippedReason,
      };
    } finally {
      if (timer) clearTimeout(timer);
      // Libéré dans un finally et jamais uniquement dans onDismiss : si aucun
      // paywall ne s'affiche (aucune règle Superwall ne correspond), onDismiss
      // ne se déclenche pas et le verrou resterait fermé pour toute la session.
      // Seulement si ce verrou est encore le notre : un appel suivant a pu le
      // reprendre apres peremption.
      if (presentingOwner === owner) {
        isPresenting = false;
        isPresentingSince = 0;
        isOnScreen = false;
      }
      lastFinishedAt = Date.now();
    }
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
