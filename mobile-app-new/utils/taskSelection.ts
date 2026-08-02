import { subjectsService, getAuthToken } from '@/lib/api';
import { calculatePriorityScore } from '@/utils/priorityScore';

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
 * Select tasks for Exam Mode
 * Returns: primary task + next 3 tasks
 */
export async function selectExamTasks(): Promise<{
  primary: TaskForExam | null;
  next: TaskForExam[];
}> {
  try {
    // Vérifier l'authentification avant d'appeler l'API
    const token = await getAuthToken();
    if (!token) {
      console.warn('⚠️ [taskSelection] Utilisateur non authentifié, impossible de récupérer les tâches');
      return { primary: null, next: [] };
    }

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
  } catch (error: any) {
    // Ne pas logger les erreurs d'authentification comme des erreurs critiques
    if (error?.message?.includes('Non authentifié') || error?.status === 401) {
      console.warn('⚠️ [taskSelection] Utilisateur non authentifié, impossible de récupérer les tâches');
    } else {
      console.error('❌ [taskSelection] Erreur lors de la sélection des tâches d\'examen:', error);
    }
    return { primary: null, next: [] };
  }
}

