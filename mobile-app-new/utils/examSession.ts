import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExamSession {
  sessionId: string;
  startedAt: number;
  plannedDuration: number; // in minutes
  hardMode: boolean;
  breaks: boolean;
  currentTaskIndex: number;
  plannedTaskIds: string[];
  completedTaskIds: string[];
  pausedAt?: number;
  totalPausedTime?: number; // in seconds
}

const SESSION_KEY = 'exam_session_active';

export async function saveExamSession(session: ExamSession): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving exam session:', error);
  }
}

export async function getActiveExamSession(): Promise<ExamSession | null> {
  try {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting exam session:', error);
    return null;
  }
}

export async function clearExamSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing exam session:', error);
  }
}

export function calculateTimeRemaining(session: ExamSession): number {
  const now = Date.now();
  const elapsed = (now - session.startedAt) / 1000; // in seconds
  const pausedTime = session.totalPausedTime || 0;
  const actualElapsed = elapsed - pausedTime;
  const remaining = (session.plannedDuration * 60) - actualElapsed;
  return Math.max(0, Math.floor(remaining));
}

