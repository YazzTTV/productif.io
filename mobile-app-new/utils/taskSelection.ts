import { subjectsService, studyPlanService, getAuthToken } from '@/lib/api';
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
 * Vrai si l'examen de la matiere est passe (jour d'examen strictement avant
 * aujourd'hui). Les dates d'examen sont stockees a minuit UTC : on lit donc le
 * jour en UTC, sinon a Montreal un examen du 10 tomberait le 9.
 */
function isExamPast(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return false;
  const examDay = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return examDay < today;
}

/**
 * Select tasks for Exam Mode
 * Returns: primary task + next 3 tasks
 *
 * L'ordre suit le PLANNING : le bloc en cours ou le prochain bloc place par le
 * planificateur passe en premier, puis les blocs suivants, puis le reste au
 * score de priorite. Avant, l'accueil classait seul, sans regarder le planning,
 * et donnait 500 points de bonus aux matieres dont l'examen etait passe : il
 * recommandait l'Anatomie (examen le 10 septembre) pendant que la carte du
 * planning, juste en dessous, placait l'Histologie (25 septembre). Les matieres
 * dont l'examen est passe sont exclues, comme le fait le planificateur.
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

    const [subjectsData, plan] = await Promise.all([
      subjectsService.getAll(),
      // Le planning est un bonus d'ordre : sans lui, on retombe sur le score.
      studyPlanService.getBlocks(2).catch(() => null),
    ]);
    // subjectsService.getAll() retourne maintenant directement un tableau
    const subjects: Subject[] = Array.isArray(subjectsData) ? subjectsData : [];

    // Flatten all incomplete tasks with their subject info
    const allTasks: TaskForExam[] = [];

    for (const subject of subjects) {
      if (!subject.tasks || !Array.isArray(subject.tasks)) continue;
      if (isExamPast(subject.deadline)) continue;

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

    // Les blocs du planning d'abord, dans l'ordre chronologique, puis le score.
    const now = Date.now();
    const plannedOrder = (plan?.blocks ?? [])
      .filter((b) => new Date(b.end).getTime() > now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .map((b) => b.taskId);
    const rank = new Map(plannedOrder.map((id, index) => [id, index]));
    allTasks.sort((a, b) => {
      const ra = rank.get(a.id);
      const rb = rank.get(b.id);
      if (ra !== undefined && rb !== undefined) return ra - rb;
      if (ra !== undefined) return -1;
      if (rb !== undefined) return 1;
      return b.priorityScore - a.priorityScore;
    });

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

