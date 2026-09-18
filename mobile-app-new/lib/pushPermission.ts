import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { notificationService } from '@/src/services/notificationService';

/**
 * Demande de permission de notification.
 *
 * Constat du 15 septembre 2026 : `push_tokens` contenait 2 lignes sur TOUTE la
 * base. La cause n'etait pas une panne, les trois pannes d'envoi ont ete
 * fermees ce jour-la. La cause est que l'app ne demandait JAMAIS la permission :
 * `usePushNotifications` constatait `undetermined` et s'arretait, et le seul
 * chemin vers la boite systeme etait un reglage que personne ne va chercher
 * (sur les 6 utilisateurs inconnus de la base, aucun n'a meme termine une
 * tache). Toute la chaine d'envoi etait donc reparee au-dessus d'un premier
 * maillon absent.
 *
 * TROIS REGLES DE CONCEPTION QUI NE SONT PAS EVIDENTES :
 *
 *   - PRIMING AVANT LA BOITE SYSTEME. Sur iOS, un refus systeme est DEFINITIF :
 *     la boite ne se represente jamais, il faut aller dans les Reglages d'iOS.
 *     On ne la declenche donc que si l'utilisateur a dit oui a une alerte
 *     in-app, qui elle peut se reposer plus tard sans rien bruler.
 *   - ON NE DEMANDE QUE SI `undetermined`. Si c'est deja `granted`, le hook
 *     enregistre le token tout seul au montage. Si c'est `denied`, la boite
 *     systeme est un no-op et le priming serait depense pour rien.
 *   - TOKEN APNs NATIF, JAMAIS LE TOKEN EXPO. Le backend envoie en APNs direct
 *     via @parse/node-apn (lib/apns.ts) et attend un device token brut ; un
 *     `ExponentPushToken[...]` est rejete en `BadDeviceToken`, constate en
 *     production le 15 septembre. C'est la raison d'etre de ce module : la
 *     logique de token vit ICI et une seule fois. Elle etait dupliquee a deux
 *     endroits dans `usePushNotifications`, et les deux copies avaient diverge.
 *
 * Le drapeau de priming est stocke PAR APPAREIL et jamais par utilisateur, pour
 * la meme raison que `lib/reviewPrompt.ts` : une permission de notification
 * appartient au systeme et a l'appareil, pas au compte applicatif.
 */

// Import dynamique, meme motif que dans le hook : le module natif est absent
// d'Expo Go, et l'app ne doit pas casser pour autant.
let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
} catch {
  Notifications = null;
}

const KEY_PRIMED = 'push_permission_primed_v1';

export type PushPermissionOutcome =
  /** L'utilisateur a accorde la permission et le token est parti au backend. */
  | 'granted'
  /** L'utilisateur a refuse, cote alerte in-app ou cote boite systeme. */
  | 'denied'
  /** Module natif absent, ou plateforme sans notifications. */
  | 'unavailable'
  /** Rien a faire : deja accorde, deja refuse au niveau systeme, ou deja demande. */
  | 'skipped';

/** Le canal Android doit exister AVANT la demande, sinon la boite POST_NOTIFICATIONS se comporte mal. */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || !Notifications) return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifications par défaut',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00C27A',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  } catch (error) {
    console.error('[pushPermission] Canal Android non configure:', error);
  }
}

/** Renvoie `granted`, `denied`, `undetermined`, ou null si le module natif est absent. */
export async function getPushPermissionStatus(): Promise<string | null> {
  if (!Notifications) return null;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status ?? null;
  } catch {
    return null;
  }
}

/**
 * Recupere le device token natif et l'envoie au backend.
 *
 * Sur les DEUX plateformes on prend `getDevicePushTokenAsync` : APNs brut cote
 * iOS, FCM natif cote Android. Le service Expo Push n'est utilise nulle part
 * dans le backend.
 */
async function registerDeviceToken(): Promise<{ token: string | null; registered: boolean }> {
  if (!Notifications) return { token: null, registered: false };
  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const token: string | undefined = deviceToken?.data;
    if (!token) return { token: null, registered: false };

    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
    const result = await notificationService.registerPushToken(token, platform);
    if (!result?.success) {
      console.error('[pushPermission] Le backend a refuse le token push:', result);
    }
    // `registered` est distingue de `token` a dessein : la permission peut etre
    // accordee cote systeme pendant que le token n'arrive pas au backend. Or le
    // backend envoie en APNs DIRECT, il n'a aucun autre moyen de joindre
    // l'appareil : annoncer "vous recevrez les notifications" dans ce cas est un
    // mensonge a l'utilisateur.
    return { token, registered: Boolean(result?.success) };
  } catch (error) {
    console.error('[pushPermission] Token push non obtenu ou non enregistre:', error);
    return { token: null, registered: false };
  }
}

/**
 * Declenche la boite systeme, puis enregistre le token si elle est acceptee.
 *
 * C'est le seul endroit du depot qui appelle `requestPermissionsAsync`.
 * `usePushNotifications.requestPermissions` delegue ici.
 */
export async function requestPushPermissionAndRegisterToken(): Promise<{
  outcome: PushPermissionOutcome;
  token: string | null;
  registered: boolean;
}> {
  if (!Notifications) return { outcome: 'unavailable', token: null, registered: false };

  try {
    await ensureAndroidChannel();

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: false,
      },
    });

    if (status !== 'granted') return { outcome: 'denied', token: null, registered: false };

    const { token, registered } = await registerDeviceToken();
    // La permission reste accordee meme si le token n'est pas parti : le hook
    // reessaiera au prochain demarrage, puisqu'il enregistre le token des que
    // le statut est `granted`.
    return { outcome: 'granted', token, registered };
  } catch (error) {
    console.error('[pushPermission] Demande de permission en echec:', error);
    return { outcome: 'unavailable', token: null, registered: false };
  }
}

/**
 * Le chemin de l'onboarding : une explication in-app, puis la boite systeme.
 *
 * Ne fait rien et ne rend la main a personne si la question a deja ete posee sur
 * cet appareil, ou si le systeme a deja tranche dans un sens ou dans l'autre.
 * Ne leve jamais : un echec ici ne doit jamais empecher la fin de l'onboarding.
 *
 * Les textes sont fournis par l'appelant, qui est un ecran et possede la langue.
 */
export async function maybePrimePushPermission(copy: {
  title: string;
  message: string;
  later: string;
  enable: string;
}): Promise<PushPermissionOutcome> {
  try {
    if (!Notifications) return 'unavailable';

    const alreadyPrimed = await AsyncStorage.getItem(KEY_PRIMED);
    const status = await getPushPermissionStatus();

    // REPRISE APRES INTERRUPTION. Le drapeau vaut 'accepted' quand l'utilisateur
    // a dit oui a l'alerte in-app mais que la boite systeme n'a pas encore rendu
    // de reponse : app tuee, plantee, ou balayee hors du selecteur pendant que
    // la boite etait affichee. Sans ce cas, le drapeau seul faisait passer en
    // `skipped` pour toujours et la boite n'etait PLUS JAMAIS proposee, alors
    // meme que la permission est restee `undetermined`. On rejoue donc la boite
    // directement, sans reposer une question a laquelle il a deja repondu oui.
    if (alreadyPrimed === 'accepted' && status === 'undetermined') {
      const { outcome } = await requestPushPermissionAndRegisterToken();
      await AsyncStorage.setItem(KEY_PRIMED, 'done');
      return outcome;
    }

    if (alreadyPrimed) return 'skipped';

    // `granted` : le hook a deja le token. `denied` : la boite systeme ne
    // s'affichera plus, autant garder le priming pour un futur ecran de reglages.
    if (status !== 'undetermined') return 'skipped';

    const accepted = await new Promise<boolean>((resolve) => {
      Alert.alert(
        copy.title,
        copy.message,
        [
          { text: copy.later, style: 'cancel', onPress: () => resolve(false) },
          { text: copy.enable, onPress: () => resolve(true) },
        ],
        { cancelable: false }
      );
    });

    // Le drapeau se pose dans les deux cas, pour ne pas redemander a chaque
    // passage, mais avec une valeur DIFFERENTE selon le cas : un refus in-app
    // est definitif, une acceptation ne l'est qu'une fois la boite systeme
    // reellement repondue. Cf. le cas de reprise en tete de fonction.
    if (!accepted) {
      await AsyncStorage.setItem(KEY_PRIMED, 'declined');
      return 'denied';
    }

    await AsyncStorage.setItem(KEY_PRIMED, 'accepted');
    const { outcome } = await requestPushPermissionAndRegisterToken();
    await AsyncStorage.setItem(KEY_PRIMED, 'done');
    return outcome;
  } catch (error) {
    console.error('[pushPermission] Priming en echec:', error);
    return 'unavailable';
  }
}
