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
  deadline?: string | null; // Deadline de la matière (ISO string)
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
 * Combines:
 * 1. Subject coefficient (higher = more important)
 * 2. Subject deadline proximity (closer = more urgent)
 * 
 * Formula:
 * priorityScore = (coefficient * 100) + deadlineUrgencyScore
 *                + priorityMultiplier + estimatedTime
 */
function calculatePriorityScore(
  task: any,
  subject: Subject
): number {
  // Base score from coefficient (coefficient * 100)
  // Higher coefficient = higher base score
  let score = subject.coefficient * 100;

  // Deadline urgency score (closer deadline = higher score)
  if (subject.deadline) {
    try {
      const deadlineDate = new Date(subject.deadline);
      const now = new Date();
      const daysUntilDeadline = Math.ceil(
        (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // If deadline is in the past, give it a high urgency score
      if (daysUntilDeadline < 0) {
        score += 500; // Very high score for overdue deadlines
      } else if (daysUntilDeadline <= 7) {
        // Within 7 days: high urgency
        score += 400 - (daysUntilDeadline * 30); // 400 to 190
      } else if (daysUntilDeadline <= 30) {
        // Within 30 days: medium urgency
        score += 200 - (daysUntilDeadline - 7) * 5; // 200 to 85
      } else if (daysUntilDeadline <= 90) {
        // Within 90 days: low urgency
        score += 80 - (daysUntilDeadline - 30) * 1; // 80 to 20
      } else {
        // More than 90 days: minimal urgency
        score += 10;
      }
    } catch (error) {
      console.error('Error parsing deadline:', error);
      // If deadline parsing fails, just use coefficient
    }
  }

  // Priority multiplier
  const priorityMultiplier = {
    high: 1.5,
    medium: 1.0,
    low: 0.5,
  };
  score *= priorityMultiplier[task.priority] || 1.0;

  // Estimated time (longer tasks get slightly more weight)
  score += (task.estimatedTime || 0) * 0.1;

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
    // subjectsService.getAll() retourne maintenant directement un tableau
    const subjects: Subject[] = Array.isArray(subjectsData) ? subjectsData : [];

    // Flatten all incomplete tasks with their subject info
    const allTasks: TaskForExam[] = [];

    for (const subject of subjects) {
      if (!subject.tasks || !Array.isArray(subject.tasks)) continue;

      console.log('📚 [taskSelection] Subject:', {
        id: subject.id,
        name: subject.name,
        nameLength: subject.name?.length,
        coefficient: subject.coefficient,
        deadline: subject.deadline,
        tasksCount: subject.tasks.length,
      });

      for (const task of subject.tasks) {
        if (task.completed) continue;

        const priorityScore = calculatePriorityScore(task, subject);

        const taskForExam = {
          id: task.id,
          title: task.title,
          subjectId: subject.id,
          subjectName: subject.name || 'Unknown Subject',
          subjectCoefficient: subject.coefficient,
          estimatedTime: task.estimatedTime || 30,
          priority: task.priority || 'medium',
          completed: false,
          priorityScore,
        };

        console.log('📝 [taskSelection] Task created:', {
          title: taskForExam.title,
          subjectName: taskForExam.subjectName,
          subjectNameLength: taskForExam.subjectName.length,
          priorityScore: taskForExam.priorityScore,
        });

        allTasks.push(taskForExam);
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

