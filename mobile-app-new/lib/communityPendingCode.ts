import AsyncStorage from '@react-native-async-storage/async-storage';

// Code d'invitation recu par lien (productifio://rejoindre/CODE), en attente
// d'etre applique par l'onglet Communaute une fois l'utilisateur connecte.
const KEY = 'community_pending_code';
// Au-dela, l'invitation est trop vieille pour qu'on l'applique sans prevenir.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function setPendingCommunityCode(code: string): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ code: code.trim(), at: Date.now() }));
}

/** Rend le code en attente et l'efface : il ne s'applique qu'une fois. */
export async function takePendingCommunityCode(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(KEY);
    const parsed = JSON.parse(raw);
    if (typeof parsed?.code !== 'string' || Date.now() - (parsed.at ?? 0) > MAX_AGE_MS) return null;
    return parsed.code;
  } catch {
    return null;
  }
}
