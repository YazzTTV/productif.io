/**
 * Lecture des blocs de revision a venir, au format que le mobile consomme.
 *
 * Partage par GET /api/planning/blocks et POST /api/onboarding/plan : les deux
 * doivent renvoyer exactement la meme forme, sinon l'ecran du planning de
 * l'onboarding et la carte de l'accueil divergent au premier champ ajoute.
 *
 * Renvoie les chapitres dates et non termines, qu'ils aient ete places par le
 * planificateur automatique ou a la main, a partir du debut du jour local.
 */

import { prisma } from '@/lib/prisma'
import { localDateKey, localTime } from '@/lib/planning/StudyPlanner'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DEFAULT_MINUTES = 30

export interface PlanningBlock {
  taskId: string
  title: string
  subjectId: string | null
  subjectName: string | null
  examDate: string | null
  start: string
  end: string
  minutes: number
  autoPlanned: boolean
}

export async function readPlanningBlocks(
  userId: string,
  timeZone: string,
  days: number,
  now: Date = new Date()
): Promise<PlanningBlock[]> {
  const todayStart = localTime(localDateKey(now, timeZone), '00:00', timeZone)
  const rangeEnd = new Date(todayStart.getTime() + days * MS_PER_DAY)

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      completed: false,
      subjectId: { not: null },
      scheduledFor: { gte: todayStart, lt: rangeEnd },
    },
    orderBy: { scheduledFor: 'asc' },
    select: {
      id: true,
      title: true,
      scheduledFor: true,
      estimatedMinutes: true,
      autoPlannedAt: true,
      subject: { select: { id: true, name: true, deadline: true } },
    },
  })

  return tasks.map((task) => {
    const start = task.scheduledFor as Date
    const minutes = task.estimatedMinutes && task.estimatedMinutes > 0 ? task.estimatedMinutes : DEFAULT_MINUTES
    return {
      taskId: task.id,
      title: task.title,
      subjectId: task.subject?.id ?? null,
      subjectName: task.subject?.name ?? null,
      examDate: task.subject?.deadline?.toISOString() ?? null,
      start: start.toISOString(),
      end: new Date(start.getTime() + minutes * 60 * 1000).toISOString(),
      minutes,
      autoPlanned: !!task.autoPlannedAt,
    }
  })
}
