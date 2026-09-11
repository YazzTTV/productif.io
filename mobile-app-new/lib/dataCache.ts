import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenStorage } from '@/lib/api';

/**
 * Cache de données local, pour que la navigation n'attende jamais le réseau.
 *
 * L'app n'a aucun gestionnaire d'état ni client de requêtes : chaque écran
 * refait ses appels à chaque affichage. Sans cache, le tout premier rendu
 * d'un écran est toujours vide, et les routes de l'API répondent en 0,3 à
 * 0,9 s même à vide (mesuré le 11 septembre 2026).
 *
 * Le principe est celui des applications qui paraissent instantanées : on
 * affiche immédiatement ce qu'on avait la dernière fois, puis on remplace par
 * la réponse du serveur quand elle arrive.
 *
 * Deux règles non négociables :
 *   - les entrées sont cloisonnées par utilisateur, sinon le compte suivant
 *     lirait les données du précédent sur le même téléphone ;
 *   - le cache est purgé à la déconnexion.
 */

type Entry<T> = { value: T; at: number };

const PREFIX = 'data_cache';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

// Miroir en mémoire : évite un aller-retour AsyncStorage dans une même session.
const memory = new Map<string, Entry<unknown>>();

function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function scopedKey(key: string): Promise<string | null> {
  const token = await TokenStorage.getInstance().getToken();
  if (!token) return null;
  const decoded = decodeJWT(token);
  const userId = decoded?.userId || decoded?.sub;
  // Sans identifiant d'utilisateur, on préfère ne rien lire ni rien écrire
  // plutôt que de risquer de mélanger deux comptes.
  if (!userId) return null;
  return `${PREFIX}:${userId}:${key}`;
}

/** Lit une valeur encore valide, ou null. Ne lève jamais. */
export async function readCache<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): Promise<T | null> {
  try {
    const k = await scopedKey(key);
    if (!k) return null;

    let entry = memory.get(k) as Entry<T> | undefined;
    if (!entry) {
      const raw = await AsyncStorage.getItem(k);
      if (!raw) return null;
      entry = JSON.parse(raw) as Entry<T>;
      memory.set(k, entry);
    }

    if (Date.now() - entry.at > ttlMs) return null;
    return entry.value;
  } catch {
    return null;
  }
}

/** Écrit une valeur. Ne lève jamais : un cache qui échoue ne doit rien casser. */
export async function writeCache<T>(key: string, value: T): Promise<void> {
  try {
    const k = await scopedKey(key);
    if (!k) return;
    const entry: Entry<T> = { value, at: Date.now() };
    memory.set(k, entry);
    await AsyncStorage.setItem(k, JSON.stringify(entry));
  } catch {
    // volontairement silencieux
  }
}

/** Purge tout le cache, tous utilisateurs confondus. Appelé à la déconnexion. */
export async function clearDataCache(): Promise<void> {
  try {
    memory.clear();
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(`${PREFIX}:`));
    if (ours.length > 0) await AsyncStorage.multiRemove(ours);
  } catch {
    // volontairement silencieux
  }
}

export const CACHE_KEYS = {
  subjects: 'subjects',
  habits: 'habits',
  habitsReview: 'habits_review',
  projects: 'projects',
  examTasks: 'exam_tasks',
} as const;
