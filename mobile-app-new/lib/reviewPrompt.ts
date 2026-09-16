import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Demande de note App Store.
 *
 * Constat du 27 août 2026, reconfirmé le 13 septembre : aucune ligne du dépôt
 * n'appelait `StoreReview`. Six mois en boutique, 0 note. C'est ce qui fait
 * perdre la requête de marque `productif` face à `Able - Planificateur
 * productif`, qui passe devant parce qu'il est populaire, et aucune réécriture
 * de métadonnées ne bat ça toute seule.
 *
 * Deux chemins, volontairement séparés :
 *
 *   1. `maybeAskForReview()` déclenche la feuille native d'Apple après un
 *      moment de valeur réelle (une session terminée). L'utilisateur note sans
 *      quitter l'app. C'est le chemin qui convertit.
 *   2. `openStoreListingForReview()` ouvre la fiche directement sur le
 *      formulaire d'avis. C'est un geste explicite de l'utilisateur, depuis les
 *      réglages, donc sans aucun quota.
 *
 * DEUX RÈGLES DE CONCEPTION QUI NE SONT PAS ÉVIDENTES :
 *
 *   - Le compteur est stocké PAR APPAREIL et jamais par utilisateur, à
 *     l'inverse de `lib/dataCache.ts`. Une note appartient à l'identifiant
 *     Apple, pas au compte applicatif : cloisonner par utilisateur ferait
 *     redemander à chaque changement de compte, et sur le même identifiant
 *     Apple. C'est pour cette raison que ce fichier ne purge rien à la
 *     déconnexion.
 *   - iOS ne dit JAMAIS si l'utilisateur a noté, ni même si la feuille s'est
 *     affichée. `requestReview()` peut ne rien faire et réussir quand même.
 *     Donc on ne peut pas réessayer sur échec, et on consomme un quota à
 *     chaque appel. D'où des seuils prudents : on préfère rater une occasion
 *     que brûler les trois demandes annuelles d'Apple sur des moments faibles.
 */

// Feuille native. Absente du package.json au 16 septembre 2026 : tant qu'elle
// n'est pas installée, seul le chemin manuel fonctionne, et l'app ne casse pas.
// Installation : npx expo install expo-store-review
let StoreReview: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  StoreReview = require('expo-store-review');
} catch {
  StoreReview = null;
}

let Application: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Application = require('expo-application');
} catch {
  Application = null;
}

/** Identifiant App Store de Productif.io, relevé par l'API iTunes le 16 septembre 2026. */
const APP_STORE_ID = '6755625569';

const KEY_EVENTS = 'review_prompt_positive_events';
const KEY_FIRST_SEEN = 'review_prompt_first_seen';
const KEY_LAST_ASK = 'review_prompt_last_ask';
const KEY_ASK_DATES = 'review_prompt_ask_dates';
const KEY_RATED_MANUALLY = 'review_prompt_rated_manually';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Nombre de moments de valeur avant la première demande. */
const MIN_POSITIVE_EVENTS = 3;
/** On ne demande rien à quelqu'un qui vient d'installer : il n'a rien à noter. */
const MIN_DAYS_SINCE_FIRST_SEEN = 3;
/** Entre deux demandes. Apple accepte plus, on se tient volontairement en deçà. */
const MIN_DAYS_BETWEEN_ASKS = 60;
/** Plafond d'Apple sur 365 jours glissants. Rappelé ici pour ne pas le dépasser. */
const MAX_ASKS_PER_YEAR = 3;

/** Les moments qui comptent. Terminer une session est la promesse centrale du produit. */
export type ReviewTrigger = 'exam_session_completed' | 'study_session_completed';

async function readNumber(key: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

async function readAskDates(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_ASK_DATES);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

/**
 * Enregistre un moment de valeur et déclenche la feuille native si tous les
 * verrous sont levés. Ne lève jamais : un échec ici ne doit pas empêcher un
 * écran de bilan de s'afficher.
 */
export async function maybeAskForReview(trigger: ReviewTrigger): Promise<void> {
  try {
    const now = Date.now();

    // Première ouverture vue par ce module : sert de point zéro à l'ancienneté.
    const firstSeen = await readNumber(KEY_FIRST_SEEN);
    if (!firstSeen) {
      await AsyncStorage.setItem(KEY_FIRST_SEEN, String(now));
    }

    const events = (await readNumber(KEY_EVENTS)) + 1;
    await AsyncStorage.setItem(KEY_EVENTS, String(events));

    // À partir d'ici on ne fait que décider. Le comptage ci-dessus a déjà eu lieu,
    // donc un utilisateur qui n'est pas encore éligible continue d'accumuler.
    if (!StoreReview) return;

    const ratedManually = await AsyncStorage.getItem(KEY_RATED_MANUALLY);
    if (ratedManually) return;

    if (events < MIN_POSITIVE_EVENTS) return;

    const since = firstSeen || now;
    if (now - since < MIN_DAYS_SINCE_FIRST_SEEN * DAY_MS) return;

    const lastAsk = await readNumber(KEY_LAST_ASK);
    if (lastAsk && now - lastAsk < MIN_DAYS_BETWEEN_ASKS * DAY_MS) return;

    const askDates = await readAskDates();
    const lastYear = askDates.filter((d) => now - d < 365 * DAY_MS);
    if (lastYear.length >= MAX_ASKS_PER_YEAR) return;

    // `isAvailableAsync` couvre le simulateur et les appareils sans App Store.
    const available =
      typeof StoreReview.isAvailableAsync === 'function'
        ? await StoreReview.isAvailableAsync()
        : true;
    if (!available) return;

    // `hasAction` dit si le système est prêt à présenter quelque chose.
    if (typeof StoreReview.hasAction === 'function') {
      const hasAction = await StoreReview.hasAction();
      if (!hasAction) return;
    }

    await StoreReview.requestReview();

    // iOS ne confirme rien : on considère le quota consommé dès l'appel.
    await AsyncStorage.setItem(KEY_LAST_ASK, String(now));
    await AsyncStorage.setItem(KEY_ASK_DATES, JSON.stringify([...lastYear, now]));
  } catch {
    // Silencieux par construction : une demande de note ratée n'est pas un incident.
  }
}

/**
 * Ouvre la fiche de l'app directement sur le formulaire d'avis.
 *
 * Utilisé par l'entrée « Noter l'application » des réglages. Aucun quota, aucun
 * verrou : c'est l'utilisateur qui demande. Fonctionne sans `expo-store-review`,
 * donc disponible même avant l'installation de la feuille native.
 */
export async function openStoreListingForReview(): Promise<boolean> {
  const androidId = Application?.applicationId || 'io.productif.app';
  const url =
    Platform.OS === 'ios'
      ? `itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`
      : `market://details?id=${androidId}`;
  const fallback =
    Platform.OS === 'ios'
      ? `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`
      : `https://play.google.com/store/apps/details?id=${androidId}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    await Linking.openURL(canOpen ? url : fallback);
    await AsyncStorage.setItem(KEY_RATED_MANUALLY, String(Date.now()));
    return true;
  } catch {
    try {
      await Linking.openURL(fallback);
      await AsyncStorage.setItem(KEY_RATED_MANUALLY, String(Date.now()));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Variante avec message d'erreur, pour un appel depuis un bouton de réglages.
 * `errorTitle` et `errorMessage` sont fournis par l'appelant, qui a la langue.
 */
export async function openStoreListingForReviewWithAlert(
  errorTitle: string,
  errorMessage: string
): Promise<void> {
  const ok = await openStoreListingForReview();
  if (!ok) Alert.alert(errorTitle, errorMessage);
}
