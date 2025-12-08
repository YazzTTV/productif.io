export type XpEventType =
  | 'task_complete'
  | 'task_priority'
  | 'habit_check'
  | 'habit_streak_bonus'
  | 'deepwork_complete'
  | 'journal_entry'
  | 'learning_entry'
  | 'achievement';

const BASE_LEVEL_XP = 100;
const LEVEL_STEP = 30;

export function computeLevel(totalXp: number) {
  let level = 1;
  let xpForNext = BASE_LEVEL_XP;
  let remaining = totalXp;

  while (remaining >= xpForNext) {
    remaining -= xpForNext;
    level += 1;
    xpForNext = BASE_LEVEL_XP + LEVEL_STEP * (level - 1);
  }

  return {
    level,
    nextLevelXp: xpForNext,
    xpIntoLevel: remaining,
    xpNeeded: xpForNext - remaining,
    progress: Math.min(1, remaining / xpForNext),
  };
}

export function computeXpForEvent(
  type: XpEventType,
  payload: Record<string, any> = {}
): number {
  switch (type) {
    case 'task_complete':
      return 10;
    case 'task_priority':
      return 20;
    case 'habit_check':
      return 8;
    case 'habit_streak_bonus':
      return payload.streak >= 30 ? 12 : payload.streak >= 7 ? 8 : 4;
    case 'deepwork_complete': {
      const minutes = payload.minutes || 0;
      let xp = Math.max(5, Math.floor(minutes)); // 1 XP/min minimum 5
      if (minutes >= 90) xp += 50;
      else if (minutes >= 50) xp += 25;
      else if (minutes >= 25) xp += 10;
      return xp;
    }
    case 'journal_entry':
      return 8;
    case 'learning_entry': {
      const minutes = payload.minutes || 0;
      return 10 + Math.floor(minutes / 2); // +1 XP par 2 minutes
    }
    case 'achievement':
      return payload.points || 50;
    default:
      return 0;
  }
}

