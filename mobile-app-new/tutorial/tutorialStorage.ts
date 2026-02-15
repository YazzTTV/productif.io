import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenStorage } from '@/lib/api';

export type TutorialStage =
  | 'calendar'
  | 'subjects'
  | 'task'
  | 'plan'
  | 'focus'
  | 'habits'
  | 'journal'
  | 'done';

const TUTORIAL_COMPLETED_KEY = 'tutorial_completed';
const TUTORIAL_STAGE_KEY = 'tutorial_stage';
const TUTORIAL_USER_KEY = 'tutorial_user_id';

function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ [TutorialStorage] Erreur lors du décodage du token:', error);
    return null;
  }
}

async function getUserId(): Promise<string | null> {
  const token = await TokenStorage.getInstance().getToken();
  if (!token) return null;
  const decoded = decodeJWT(token);
  return decoded?.userId || decoded?.sub || null;
}

async function getScopedKeys() {
  const userId = await getUserId();
  const completedKey = userId ? `${TUTORIAL_COMPLETED_KEY}:${userId}` : TUTORIAL_COMPLETED_KEY;
  const stageKey = userId ? `${TUTORIAL_STAGE_KEY}:${userId}` : TUTORIAL_STAGE_KEY;
  return { userId, completedKey, stageKey };
}

export async function getTutorialCompleted(): Promise<boolean> {
  const { userId, completedKey } = await getScopedKeys();
  let value = await AsyncStorage.getItem(completedKey);
  if (value === null && userId) {
    // Ne pas hériter d'un ancien état global d'un autre compte
    const legacyUserId = await AsyncStorage.getItem(TUTORIAL_USER_KEY);
    if (legacyUserId && legacyUserId === userId) {
      value = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
      if (value !== null) {
        await AsyncStorage.setItem(completedKey, value);
      }
    }
  }
  const completed = value === 'true';
  console.log('[TutorialStorage] getTutorialCompleted ->', completed, 'userId:', userId);
  return completed;
}

export async function setTutorialCompleted(completed: boolean) {
  const { userId, completedKey } = await getScopedKeys();
  console.log('[TutorialStorage] setTutorialCompleted ->', completed, 'userId:', userId);
  await AsyncStorage.setItem(completedKey, completed ? 'true' : 'false');
  if (userId) {
    await AsyncStorage.setItem(TUTORIAL_USER_KEY, userId);
  }
}

export async function getTutorialStage(): Promise<TutorialStage | null> {
  const { userId, stageKey } = await getScopedKeys();
  let value = await AsyncStorage.getItem(stageKey);
  if (value === null && userId) {
    const legacyUserId = await AsyncStorage.getItem(TUTORIAL_USER_KEY);
    if (legacyUserId && legacyUserId === userId) {
      value = await AsyncStorage.getItem(TUTORIAL_STAGE_KEY);
      if (value !== null) {
        await AsyncStorage.setItem(stageKey, value);
      }
    }
  }
  const stage = (value as TutorialStage) || null;
  console.log('[TutorialStorage] getTutorialStage ->', stage, 'userId:', userId);
  return stage;
}

export async function setTutorialStage(stage: TutorialStage) {
  const { userId, stageKey } = await getScopedKeys();
  console.log('[TutorialStorage] setTutorialStage ->', stage, 'userId:', userId);
  await AsyncStorage.setItem(stageKey, stage);
  if (userId) {
    await AsyncStorage.setItem(TUTORIAL_USER_KEY, userId);
  }
}

export async function markTutorialDone() {
  const { userId, completedKey, stageKey } = await getScopedKeys();
  console.log('[TutorialStorage] markTutorialDone', 'userId:', userId);
  await AsyncStorage.setItem(completedKey, 'true');
  await AsyncStorage.setItem(stageKey, 'done');
  if (userId) {
    await AsyncStorage.setItem(TUTORIAL_USER_KEY, userId);
  }
}

export async function resetTutorial() {
  const { userId, completedKey, stageKey } = await getScopedKeys();
  console.log('[TutorialStorage] resetTutorial', 'userId:', userId);
  await AsyncStorage.removeItem(completedKey);
  await AsyncStorage.removeItem(stageKey);
  await AsyncStorage.removeItem(TUTORIAL_COMPLETED_KEY);
  await AsyncStorage.removeItem(TUTORIAL_STAGE_KEY);
}
