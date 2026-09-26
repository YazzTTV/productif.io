/**
 * Seances generiques d'une matiere sans chapitres (Task.generated = true).
 *
 * A l'onboarding, un etudiant qui repond « pas encore » aux chapitres obtient
 * des seances generiques : sans elles, une matiere ne produit aucun bloc
 * (StudyPlanner ne place que des chapitres) et le planning montre des jours
 * vides. Ces seances ne tiennent que la place : des que de vrais chapitres
 * arrivent dans la matiere, celles qui ne sont pas terminees disparaissent.
 *
 * Les seances terminees restent : elles portent le temps de travail reel et
 * l'historique (TaskHistory, TimeEntry). Cote base, TimeEntry.taskId est en
 * ON DELETE SET NULL, TaskHistory et ScheduledTaskEvent en CASCADE : la
 * suppression ne bute sur aucune cle etrangere.
 */

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Requete de suppression des seances generiques non terminees d'une matiere.
 * Renvoie la requete Prisma sans l'executer, pour pouvoir la mettre dans le
 * meme $transaction que la creation des vrais chapitres.
 *
 * `db` : le client d'une transaction interactive (POST /api/onboarding/plan),
 * sinon le client global, pour un $transaction([...]) en tableau.
 */
export function deleteGeneratedSessions(
  userId: string,
  subjectId: string,
  db: Prisma.TransactionClient = prisma
) {
  return db.task.deleteMany({
    where: { userId, subjectId, generated: true, completed: false },
  })
}
