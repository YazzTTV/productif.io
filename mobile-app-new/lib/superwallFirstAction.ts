import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenStorage } from '@/lib/api';

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
