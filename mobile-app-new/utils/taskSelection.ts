import { subjectsService } from '@/lib/api';

export interface TaskForExam {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  subjectCoefficient: number;
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  priorityScore: number;
}

export interface Subject {
  id: string;
  name: string;
  coefficient: number;
  tasks: Array<{
    id: string;
    title: string;
    estimatedTime: number;
    priority: 'high' | 'medium' | 'low';
    completed: boolean;
  }>;
}

/**
 * Calculate priority score for a task
 * priorityScore = subjectCoefficient * 100
 *                + examProximityScore (if exists)
 *                + difficultyScore (if exists)
 *                - fatiguePenalty (if tracked)
 */
function calculatePriorityScore(
  task: any,
  subject: Subject
): number {
  let score = subject.coefficient * 100;

  // Priority multiplier
  const priorityMultiplier = {
    high: 1.5,
    medium: 1.0,
    low: 0.5,
  };
  score *= priorityMultiplier[task.priority] || 1.0;

  // Exam proximity (if deadline exists, closer = higher score)
  // This would need deadline data - for now, we'll skip it

  // Difficulty (estimated time as proxy - longer = more important)
  score += task.estimatedTime || 0;

  // Fatigue penalty (not tracked yet, skip)

  return score;
}

/**
 * Select tasks for Exam Mode
 * Returns: primary task + next 3 tasks
 */
export async function selectExamTasks(): Promise<{
  primary: TaskForExam | null;
  next: TaskForExam[];
}> {
  try {
    const subjectsData = await subjectsService.getAll();
    const subjects: Subject[] = Array.isArray(subjectsData) ? subjectsData : [];

    // Flatten all incomplete tasks with their subject info
    const allTasks: TaskForExam[] = [];

    for (const subject of subjects) {
      if (!subject.tasks || !Array.isArray(subject.tasks)) continue;

      for (const task of subject.tasks) {
        if (task.completed) continue;

        const priorityScore = calculatePriorityScore(task, subject);

        allTasks.push({
          id: task.id,
          title: task.title,
          subjectId: subject.id,
          subjectName: subject.name,
          subjectCoefficient: subject.coefficient,
          estimatedTime: task.estimatedTime || 30,
          priority: task.priority || 'medium',
          completed: false,
          priorityScore,
        });
      }
    }

    // Sort by priority score (highest first)
    allTasks.sort((a, b) => b.priorityScore - a.priorityScore);

    // Select primary (highest) and next 3
    const primary = allTasks.length > 0 ? allTasks[0] : null;
    const next = allTasks.slice(1, 4);

    return { primary, next };
  } catch (error) {
    console.error('Error selecting exam tasks:', error);
    return { primary: null, next: [] };
  }
}

