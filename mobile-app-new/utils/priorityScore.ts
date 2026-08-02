/**
 * Score de priorité d'un chapitre, partagé entre l'écran Matières et le tri du
 * Mode Examen.
 *
 * Il vivait uniquement dans `taskSelection.ts`, donc l'écran Matières affichait
 * un ordre sans rapport avec celui que le Mode Examen appliquait ensuite. Les
 * deux lisent maintenant la même fonction : ce que l'utilisateur voit en rouge
 * est ce que le Mode Examen lui donnera en premier.
 */

export type PriorityLabel = 'high' | 'medium' | 'low';
export type PriorityTier = 'critical' | 'important' | 'later';

export interface ScorableTask {
  id: string;
  priority?: PriorityLabel;
  estimatedTime?: number;
}

export interface ScorableSubject {
  coefficient: number;
  // L'API renvoie une chaîne ISO, l'écran Matières manipule parfois un Date.
  deadline?: string | Date | null;
}

const PRIORITY_MULTIPLIER: Record<PriorityLabel, number> = {
  high: 1.5,
  medium: 1.0,
  low: 0.5,
};

/**
 * Combine le coefficient de la matière, la proximité de l'examen et la priorité
 * déclarée. Plus le score est haut, plus le chapitre passe tôt.
 */
export function calculatePriorityScore(
  task: ScorableTask,
  subject: ScorableSubject
): number {
  let score = subject.coefficient * 100;

  if (subject.deadline) {
    try {
      const deadlineDate = new Date(subject.deadline);
      const now = new Date();
      const daysUntilDeadline = Math.ceil(
        (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (Number.isNaN(daysUntilDeadline)) {
        // Deadline illisible : on ne fabrique pas d'urgence.
      } else if (daysUntilDeadline < 0) {
        score += 500; // examen dépassé, on remonte tout ce qui reste
      } else if (daysUntilDeadline <= 7) {
        score += 400 - daysUntilDeadline * 30; // 400 -> 190
      } else if (daysUntilDeadline <= 30) {
        score += 200 - (daysUntilDeadline - 7) * 5; // 200 -> 85
      } else if (daysUntilDeadline <= 90) {
        score += 80 - (daysUntilDeadline - 30); // 80 -> 20
      } else {
        score += 10;
      }
    } catch (error) {
      console.error('[priorityScore] Deadline illisible:', error);
    }
  }

  score *= PRIORITY_MULTIPLIER[task.priority || 'medium'] ?? 1.0;
  score += (task.estimatedTime || 0) * 0.1;

  return score;
}

/**
 * Répartit les chapitres en trois paliers de couleur.
 *
 * Volontairement relatif et non basé sur des seuils absolus : un score dépend du
 * coefficient et de la distance à l'examen, donc en début de semestre tout
 * serait vert et la veille d'un partiel tout serait rouge. Ce qui est utile à
 * l'écran, c'est "par quoi je commence maintenant", donc un classement.
 *
 * Répartition : le quart le plus urgent en critique, le tiers suivant en
 * important, le reste plus tard.
 */
export function assignPriorityTiers(
  scored: Array<{ id: string; score: number }>
): Map<string, PriorityTier> {
  const tiers = new Map<string, PriorityTier>();
  if (scored.length === 0) return tiers;

  const ordered = [...scored].sort((a, b) => b.score - a.score);

  // Avec très peu de chapitres, un quart arrondi à zéro ne colorerait rien.
  const criticalCount = Math.max(1, Math.round(ordered.length * 0.25));
  const importantCount = Math.round(ordered.length * 0.35);

  ordered.forEach((item, index) => {
    if (index < criticalCount) {
      tiers.set(item.id, 'critical');
    } else if (index < criticalCount + importantCount) {
      tiers.set(item.id, 'important');
    } else {
      tiers.set(item.id, 'later');
    }
  });

  return tiers;
}

export const TIER_COLORS: Record<PriorityTier, string> = {
  critical: '#EF4444',
  important: '#F59E0B',
  later: '#16A34A',
};
