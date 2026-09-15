import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenStorage } from '@/lib/api';
import { SUPERWALL_EVENTS, SuperwallEventName } from '@/lib/superwallEvents';

const KEY_PREFIX = 'superwall_user_first_action_done';

function decodeJWT(token: string): { userId?: string; sub?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

async function getStorageKey(): Promise<string> {
  const token = await TokenStorage.getInstance().getToken();
  if (!token) return KEY_PREFIX;
  const decoded = decodeJWT(token);
  const userId = decoded?.userId || decoded?.sub;
  return userId ? `${KEY_PREFIX}:${userId}` : KEY_PREFIX;
}

/** Première création de tâche manuelle utile pour la campagne user_first_action (une fois par compte). */
export async function shouldTriggerUserFirstAction(): Promise<boolean> {
  return (await AsyncStorage.getItem(await getStorageKey())) !== 'true';
}

export async function markUserFirstActionTriggered(): Promise<void> {
  await AsyncStorage.setItem(await getStorageKey(), 'true');
}

/**
 * Placement a jouer a la fin d'une session focus.
 *
 * La PREMIERE session d'un compte porte `user_first_action`, les suivantes
 * portent `focus_completed`. Un seul des deux part, jamais les deux : le SDK
 * refuse deux presentations simultanees, donc la seconde serait avalee en
 * silence par la garde `isPresenting` de useSuperwall.
 *
 * Pourquoi ici et plus a la creation de tache : le placement etait accroche a
 * la premiere tache creee, c'est a dire a un moment ou l'utilisateur n'a encore
 * rien vecu du produit. Releve en base le 12 septembre, les 4 comptes qui
 * avaient cree une tache sont tous repartis en 2 a 7 minutes. La fin d'une
 * session est le premier instant ou la promesse a ete tenue.
 */
export async function resolveFocusPlacement(): Promise<{
  placement: SuperwallEventName;
  isFirstAction: boolean;
}> {
  const isFirstAction = await shouldTriggerUserFirstAction();
  return {
    placement: isFirstAction
      ? SUPERWALL_EVENTS.USER_FIRST_ACTION
      : SUPERWALL_EVENTS.FOCUS_COMPLETED,
    isFirstAction,
  };
}
