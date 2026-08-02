import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DeviceActivity from 'react-native-device-activity';

/**
 * Blocage des applications distrayantes pendant une session de Mode Examen.
 *
 * Repose sur Family Controls / ManagedSettings (iOS 15+). Apple ne communique
 * jamais à l'app quelles applications l'utilisateur a sélectionnées : la
 * sélection est un jeton opaque persisté par l'extension. On ne peut donc ni
 * lire ni logger la liste, seulement compter les éléments.
 *
 * Android n'a pas d'équivalent utilisable sans permission d'accessibilité, et
 * reste hors périmètre. Toutes les fonctions sont des no-op ailleurs que sur iOS.
 */

/** Identifiant de la sélection persistée côté natif. */
export const BLOCKED_APPS_SELECTION_ID = 'examModeBlockedApps';

/** Nom de l'activité DeviceActivity qui porte le filet de sécurité. */
const SAFETY_NET_ACTIVITY = 'examModeSafetyNet';

/**
 * Trace locale de ce que l'app croit avoir posé. Sert uniquement à la
 * réconciliation au démarrage : la source de vérité reste `isShieldActive()`.
 */
const ACTIVE_BLOCK_KEY = '@productif_active_block';

interface ActiveBlockRecord {
  sessionId: string;
  /** Timestamp epoch ms auquel le bouclier doit impérativement tomber. */
  expiresAt: number;
}

export function isAppBlockingSupported(): boolean {
  if (Platform.OS !== 'ios') return false;
  try {
    return DeviceActivity.isAvailable();
  } catch {
    return false;
  }
}

export function getAuthorizationStatus(): 'notDetermined' | 'denied' | 'approved' | 'unsupported' {
  if (!isAppBlockingSupported()) return 'unsupported';
  try {
    switch (DeviceActivity.getAuthorizationStatus()) {
      case DeviceActivity.AuthorizationStatus.approved:
        return 'approved';
      case DeviceActivity.AuthorizationStatus.denied:
        return 'denied';
      default:
        return 'notDetermined';
    }
  } catch (error) {
    console.error('[appBlocking] Lecture du statut impossible:', error);
    return 'notDetermined';
  }
}

/**
 * Ouvre la demande d'autorisation système. `forIndividualOrChild: individual`
 * est capital : c'est ce qui distingue l'auto-restriction du contrôle parental,
 * et c'est le cas d'usage sur lequel l'entitlement a été accordé.
 */
export async function requestAuthorization(): Promise<boolean> {
  if (!isAppBlockingSupported()) return false;
  try {
    await DeviceActivity.requestAuthorization('individual');
    return getAuthorizationStatus() === 'approved';
  } catch (error) {
    console.error('[appBlocking] Autorisation refusée ou indisponible:', error);
    return false;
  }
}

/**
 * Nombre d'apps, de catégories et de domaines sélectionnés. 0 si rien.
 *
 * On interroge par identifiant plutôt que de relire la chaîne persistée puis de
 * la repasser comme jeton : cela évite de supposer quoi que ce soit sur le
 * format de ce que le natif a stocké.
 */
/**
 * Somme les éléments d'une sélection.
 *
 * Le natif renvoie `webdomainCount` en minuscules alors que le typage de la
 * librairie déclare `webDomainCount`. Additionner le champ typé donnait donc
 * `undefined`, la somme valait NaN, et `NaN > 0` étant faux la sélection
 * passait pour vide : interrupteur grisé, et `startBlocking` sortait en
 * `no_selection` sans jamais poser de bouclier. Les deux orthographes sont
 * lues, et tout champ absent vaut zéro.
 */
function countSelection(metadata: any): number {
  if (!metadata) return 0;
  const applications = Number(metadata.applicationCount) || 0;
  const categories = Number(metadata.categoryCount) || 0;
  const webDomains =
    Number(metadata.webDomainCount ?? metadata.webdomainCount) || 0;
  return applications + categories + webDomains;
}

export function getBlockedSelectionCount(): number {
  if (!isAppBlockingSupported()) return 0;

  // Lecture par identifiant, puis repli sur le jeton persisté : selon les
  // versions, l'un des deux peut renvoyer undefined alors que la sélection
  // existe.
  try {
    const byId = DeviceActivity.activitySelectionMetadata({
      activitySelectionId: BLOCKED_APPS_SELECTION_ID,
    });
    const countById = countSelection(byId);
    if (countById > 0) return countById;

    const token = DeviceActivity.getFamilyActivitySelectionId(BLOCKED_APPS_SELECTION_ID);
    if (!token) return 0;

    return countSelection(
      DeviceActivity.activitySelectionMetadata({ activitySelectionToken: token })
    );
  } catch (error) {
    console.error('[appBlocking] Lecture de la sélection impossible:', error);
    return 0;
  }
}

export function hasBlockedAppsConfigured(): boolean {
  return getBlockedSelectionCount() > 0;
}

function buildShieldConfiguration() {
  return {
    backgroundColor: { red: 10, green: 10, blue: 10, alpha: 1 },
    title: 'Bloc de révision en cours',
    titleColor: { red: 255, green: 255, blue: 255, alpha: 1 },
    subtitle: "Cette app se rouvrira toute seule à la fin du bloc. Tu n'as rien à décider.",
    subtitleColor: { red: 255, green: 255, blue: 255, alpha: 0.7 },
    primaryButtonLabel: 'Retour aux révisions',
    primaryButtonLabelColor: { red: 255, green: 255, blue: 255, alpha: 1 },
    primaryButtonBackgroundColor: { red: 22, green: 163, blue: 74, alpha: 1 },
  } as DeviceActivity.ShieldConfiguration;
}

/**
 * Le bouton du bouclier ferme simplement l'écran. Volontairement aucune action
 * de déblocage : proposer "débloquer" sur l'écran de blocage annulerait tout
 * l'intérêt, et c'est la promesse faite dans les démos ("je ne peux pas le
 * débloquer moi-même").
 */
function buildShieldActions(): DeviceActivity.ShieldActions {
  return {
    primary: {
      behavior: 'close',
    },
  };
}

/**
 * Filet de sécurité indépendant de l'app.
 *
 * Si l'app crashe ou est tuée pendant une session, plus personne côté JS ne
 * peut lever le bouclier et l'utilisateur se retrouve avec ses apps bloquées
 * sans recours. On programme donc dans l'extension DeviceActivity un
 * `resetBlocks` déclenché à la fin de l'intervalle, qui s'exécute même app
 * morte.
 */
/**
 * DeviceActivity refuse tout intervalle de moins de 15 minutes, avec l'erreur
 * "Le programme de l'activité est trop court".
 *
 * On vise 16 et non 15 : la borne d'Apple est stricte, et entre le calcul des
 * composantes de date ici et l'enregistrement côté système il s'écoule assez de
 * temps pour repasser sous les 15 minutes. Une minute de marge absorbe cette
 * dérive. Conséquence assumée : sur une session plus courte que 16 minutes, le
 * filet de sécurité se déclenche après la fin de la session. Ce n'est pas
 * gênant, le chemin normal lève déjà le bouclier à la fin ; le filet ne sert
 * que si l'app est morte.
 */
const MIN_MONITORING_MINUTES = 16;

/**
 * Composantes de date complètes, année et jour compris.
 *
 * Ne donner que l'heure rendrait l'intervalle ambigu dès qu'une session passe
 * minuit : un bloc lancé à 23h50 pour 45 minutes finit à 00h35, et un
 * `intervalEnd` à 0h "avant" un `intervalStart` à 23h n'a pas de sens sans la
 * date. C'est un cas fréquent chez des étudiants qui révisent le soir.
 */
function toDateComponents(date: Date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1, // DateComponents attend 1-12
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  };
}

async function armSafetyNet(durationMinutes: number): Promise<void> {
  const now = new Date();
  const monitoredMinutes = Math.max(durationMinutes, MIN_MONITORING_MINUTES);

  // Le début est l'instant présent, sans décalage. Ajouter une seconde ici
  // raccourcissait l'intervalle d'autant et suffisait à repasser sous la borne
  // des 15 minutes sur une session courte.
  const end = new Date(now.getTime() + monitoredMinutes * 60 * 1000);

  console.log(
    `[appBlocking] filet de securite: ${monitoredMinutes} min, ` +
      `${now.toISOString()} -> ${end.toISOString()}`
  );

  DeviceActivity.configureActions({
    activityName: SAFETY_NET_ACTIVITY,
    callbackName: 'intervalDidEnd',
    actions: [{ type: 'resetBlocks' }],
  });

  await DeviceActivity.startMonitoring(
    SAFETY_NET_ACTIVITY,
    {
      intervalStart: toDateComponents(now),
      intervalEnd: toDateComponents(end),
      repeats: false,
    },
    []
  );
}

function disarmSafetyNet(): void {
  try {
    DeviceActivity.stopMonitoring([SAFETY_NET_ACTIVITY]);
    DeviceActivity.cleanUpAfterActivity(SAFETY_NET_ACTIVITY);
  } catch (error) {
    console.error('[appBlocking] Désarmement du filet de sécurité:', error);
  }
}

export interface StartBlockingResult {
  started: boolean;
  reason?: 'unsupported' | 'not_authorized' | 'no_selection' | 'error';
}

/**
 * Pose le bouclier pour la durée de la session.
 *
 * Ne jamais faire échouer la session parce que le blocage échoue : une session
 * de révision sans bouclier reste une session de révision. L'appelant décide
 * quoi afficher à partir de `reason`.
 */
export async function startBlocking(
  sessionId: string,
  durationMinutes: number
): Promise<StartBlockingResult> {
  if (!isAppBlockingSupported()) return { started: false, reason: 'unsupported' };
  if (getAuthorizationStatus() !== 'approved') {
    return { started: false, reason: 'not_authorized' };
  }
  if (!hasBlockedAppsConfigured()) return { started: false, reason: 'no_selection' };

  try {
    DeviceActivity.updateShield(buildShieldConfiguration(), buildShieldActions());

    DeviceActivity.blockSelection(
      { activitySelectionId: BLOCKED_APPS_SELECTION_ID },
      `exam_session_${sessionId}`
    );

    await armSafetyNet(durationMinutes);

    const record: ActiveBlockRecord = {
      sessionId,
      expiresAt: Date.now() + durationMinutes * 60 * 1000,
    };
    await AsyncStorage.setItem(ACTIVE_BLOCK_KEY, JSON.stringify(record));

    return { started: true };
  } catch (error) {
    console.error('[appBlocking] Pose du bouclier impossible:', error);
    // Ne pas laisser un bouclier à moitié posé si armSafetyNet a échoué :
    // sans filet, il n'y aurait plus rien pour le lever.
    await stopBlocking('start_failed');
    return { started: false, reason: 'error' };
  }
}

/** Lève le bouclier. Idempotent, sûr à appeler même si rien n'est posé. */
export async function stopBlocking(reason: string): Promise<void> {
  if (!isAppBlockingSupported()) return;
  try {
    DeviceActivity.resetBlocks(reason);
    disarmSafetyNet();
  } catch (error) {
    console.error('[appBlocking] Levée du bouclier:', error);
  } finally {
    await AsyncStorage.removeItem(ACTIVE_BLOCK_KEY);
  }
}

/**
 * Blocage en cours, avec son échéance, ou null.
 *
 * Permet à l'interface de rattraper le cas où l'app a été tuée pendant une
 * session : le bouclier survit dans l'extension, mais l'état de la session
 * focus n'est que du state React et meurt avec l'app. Sans cette lecture,
 * l'utilisateur revient sur un écran sans session, avec ses apps bloquées et
 * aucun moyen d'y mettre fin.
 */
export async function getActiveBlock(): Promise<ActiveBlockRecord | null> {
  if (!isAppBlockingSupported()) return null;
  if (!isBlockingActive()) return null;

  try {
    const raw = await AsyncStorage.getItem(ACTIVE_BLOCK_KEY);
    if (!raw) return null;
    const record: ActiveBlockRecord = JSON.parse(raw);
    if (!record?.expiresAt || Date.now() >= record.expiresAt) return null;
    return record;
  } catch (error) {
    console.error('[appBlocking] Lecture du blocage actif impossible:', error);
    return null;
  }
}

export function isBlockingActive(): boolean {
  if (!isAppBlockingSupported()) return false;
  try {
    return DeviceActivity.isShieldActive();
  } catch {
    return false;
  }
}

/**
 * Réconciliation au démarrage et à chaque retour au premier plan.
 *
 * Deuxième filet, côté app cette fois. Il rattrape les cas que l'extension ne
 * couvre pas : session terminée normalement mais `stopBlocking` jamais atteint,
 * horloge décalée, ou trace locale orpheline. La règle est volontairement
 * asymétrique : dans le doute, on lève le bouclier. Un bouclier qui saute trop
 * tôt est un désagrément, un bouclier coincé est un avis 1 étoile.
 *
 * L'autorité est la trace écrite par `startBlocking`, et rien d'autre. Une
 * version antérieure exigeait en plus une session examen active : le blocage
 * ayant été câblé sur le flux focus, qui ne crée pas de session examen, le
 * bouclier sautait dès le premier retour dans l'app. La trace est le seul
 * signal commun aux deux flux.
 */
export async function reconcileBlockingState(): Promise<void> {
  if (!isAppBlockingSupported()) return;

  try {
    const shieldActive = isBlockingActive();
    const raw = await AsyncStorage.getItem(ACTIVE_BLOCK_KEY);
    const record: ActiveBlockRecord | null = raw ? JSON.parse(raw) : null;

    if (!shieldActive) {
      // Rien de posé : nettoyer une trace orpheline et s'assurer qu'aucune
      // surveillance ne traîne.
      if (record) {
        await AsyncStorage.removeItem(ACTIVE_BLOCK_KEY);
        disarmSafetyNet();
      }
      return;
    }

    // Trace absente alors que le bouclier est posé : bouclier orphelin, par
    // exemple après une réinstallation. On lève.
    if (!record) {
      await stopBlocking('reconcile_orphan');
      return;
    }

    if (Date.now() >= record.expiresAt) {
      await stopBlocking('reconcile_expired');
    }
  } catch (error) {
    console.error('[appBlocking] Réconciliation impossible:', error);
    // Une réconciliation qui échoue ne doit pas laisser un bouclier coincé.
    await stopBlocking('reconcile_error');
  }
}
