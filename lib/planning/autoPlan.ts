/**
 * Planification automatique : relit la base, appelle StudyPlanner, ecrit les blocs.
 *
 * Appele sans aucun tap :
 *   - apres chaque modification de matiere ou import de chapitres (declencheurs) ;
 *   - chaque nuit par /api/planning/nightly.
 *
 * Ce qui est deplace, et ce qui ne l'est jamais :
 *   - les chapitres sans creneau, et ceux dont le creneau a ete choisi par le
 *     planificateur (Task.autoPlannedAt non nul) et qui sont a venir ;
 *   - un creneau choisi par l'utilisateur (autoPlannedAt nul) n'est JAMAIS
 *     deplace : il compte comme occupe ;
 *   - un bloc du jour deja commence n'est pas deplace en cours de journee (on ne
 *     bouge pas une session pendant qu'on la fait) ;
 *   - un bloc automatique d'un jour passe et non fait est rattrape, mais
 *     seulement en premium (catchUpMode "full"). En gratuit il reste en retard,
 *     et c'est la banniere de rattrapage qui le montre.
 *
 * Tout est attendu par l'appelant : une ecriture non attendue dans une route
 * Vercel est tuee par le gel serverless des la reponse renvoyee.
 */

import { prisma } from '@/lib/prisma'
import { getPlanInfo } from '@/lib/plans'
import { resolveTimezone } from '@/lib/timezone'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'
import {
  planStudy,
  localDateKey,
  localTime,
  DEFAULT_OPTIONS,
  DEFAULT_BLOCK_MINUTES,
  type BusyInterval,
  type PlannerTask,
  type StudyPlan,
} from '@/lib/planning/StudyPlanner'

const MS_PER_MINUTE = 60 * 1000
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE
/** Au-dela, un instantane Apple est trop vieux pour decrire l'agenda. */
const SNAPSHOT_MAX_AGE_MS = 3 * MS_PER_DAY
const GOOGLE_TIMEOUT_MS = 8000

export type ReplanReason = 'nightly' | 'subject_change' | 'chapters_import' | 'task_created' | 'busy_slots' | 'manual'

export interface ReplanResult {
  userId: string
  reason: ReplanReason
  skipped?: 'no_subjects'
  blocksWritten: number
  unscheduled: number
  unplaced: number
  unplacedReasons?: Record<string, number>
  catchUp: boolean
  busySources: string[]
  /** Rempli en mode simulation seulement. */
  preview?: { blocks: { taskId: string; start: string; end: string; minutes: number }[]; timeZone: string }
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])
}

function parseSnapshotSlots(raw: unknown): BusyInterval[] {
  if (!Array.isArray(raw)) return []
  const out: BusyInterval[] = []
  for (const slot of raw) {
    const start = new Date((slot as any)?.start)
    const end = new Date((slot as any)?.end)
    if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end > start) {
      out.push({ start, end })
    }
  }
  return out
}

export async function replanUser(
  userId: string,
  reason: ReplanReason,
  now: Date = new Date(),
  options: { dryRun?: boolean } = {}
): Promise<ReplanResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      timezone: true,
      subscriptionStatus: true,
      subscriptionTier: true,
      stripeSubscriptionId: true,
      calendarBusySnapshot: true,
    },
  })
  if (!user) throw new Error(`replanUser: utilisateur ${userId} introuvable`)

  const timeZone = resolveTimezone(user)
  const premium = getPlanInfo(user).limits.catchUpMode === 'full'
  const horizonDays = DEFAULT_OPTIONS.horizonDays

  const todayKey = localDateKey(now, timeZone)
  const todayStart = localTime(todayKey, '00:00', timeZone)
  const horizonEnd = new Date(todayStart.getTime() + (horizonDays + 1) * MS_PER_DAY)

  const subjects = await prisma.subject.findMany({
    where: { userId },
    select: { id: true, name: true, coefficient: true, deadline: true },
  })
  const baseResult = { userId, reason, blocksWritten: 0, unscheduled: 0, unplaced: 0, catchUp: false, busySources: [] as string[] }
  if (subjects.length === 0) return { ...baseResult, skipped: 'no_subjects' }

  const tasks = await prisma.task.findMany({
    where: { userId, completed: false, subjectId: { in: subjects.map((s) => s.id) } },
    select: {
      id: true,
      subjectId: true,
      estimatedMinutes: true,
      dueDate: true,
      order: true,
      createdAt: true,
      scheduledFor: true,
      autoPlannedAt: true,
    },
  })

  // Tri de chaque chapitre : a planifier, ou fixe (compte comme occupe).
  const plannable: PlannerTask[] = []
  const fixed: BusyInterval[] = []
  let catchUp = false

  for (const task of tasks) {
    const minutes = task.estimatedMinutes && task.estimatedMinutes > 0 ? task.estimatedMinutes : DEFAULT_BLOCK_MINUTES
    const toPlanner: PlannerTask = {
      id: task.id,
      subjectId: task.subjectId as string,
      estimatedMinutes: task.estimatedMinutes,
      dueDate: task.dueDate,
      order: task.order,
      createdAt: task.createdAt,
    }

    if (!task.scheduledFor) {
      plannable.push(toPlanner)
      continue
    }

    const start = task.scheduledFor
    const end = new Date(start.getTime() + minutes * MS_PER_MINUTE)

    if (!task.autoPlannedAt) {
      // Choisi par l'utilisateur : intouchable.
      if (end > now && start < horizonEnd) fixed.push({ start, end })
      continue
    }

    if (start >= todayStart && start <= new Date(now.getTime() + DEFAULT_OPTIONS.minLeadMinutes * MS_PER_MINUTE)) {
      // Bloc du jour deja commence ou imminent : on le laisse ou il est.
      if (end > now) fixed.push({ start, end })
      continue
    }

    if (start < todayStart) {
      // Rate un jour precedent : rattrapage automatique en premium seulement.
      if (premium) {
        plannable.push(toPlanner)
        catchUp = true
      }
      continue
    }

    plannable.push(toPlanner)
  }

  // Creneaux occupes : Google (lu par le serveur) et Apple (instantane envoye par le telephone).
  const busy: BusyInterval[] = [...fixed]
  const busySources: string[] = []

  try {
    if (await googleCalendarService.isConnected(userId)) {
      // Un jeton expire ou revoque fait renvoyer [] par getBusyTimes, comme un
      // agenda vide : on verifie le jeton d'abord pour ne pas planifier par-dessus
      // des cours en croyant l'agenda lu. Le jeton valide est mis en cache, donc
      // getBusyTimes ne le rafraichit pas une seconde fois.
      const token = await withTimeout(googleCalendarService.refreshTokenIfNeeded(userId), GOOGLE_TIMEOUT_MS, null)
      if (!token) {
        busySources.push('google_unreadable')
      } else {
        const periods = await withTimeout(
          googleCalendarService.getBusyTimes(userId, now, horizonEnd),
          GOOGLE_TIMEOUT_MS,
          null as any
        )
        if (Array.isArray(periods)) {
          busy.push(...periods.map((p: any) => ({ start: new Date(p.start), end: new Date(p.end) })))
          busySources.push('google')
        } else {
          busySources.push('google_timeout')
        }
      }
    }
  } catch (error) {
    console.warn(`[autoPlan] agenda Google illisible pour ${userId}, on planifie sans`, error)
  }

  const snapshot = user.calendarBusySnapshot
  if (snapshot && now.getTime() - snapshot.updatedAt.getTime() < SNAPSHOT_MAX_AGE_MS) {
    busy.push(...parseSnapshotSlots(snapshot.slots))
    busySources.push(snapshot.source)
  }

  const plan: StudyPlan = planStudy(
    subjects.map((s) => ({ id: s.id, name: s.name, coefficient: s.coefficient, deadline: s.deadline })),
    plannable,
    busy,
    { now, timeZone, horizonDays }
  )

  // Ecritures : seulement ce qui change.
  const current = new Map(tasks.map((t) => [t.id, t]))
  const placed = new Set<string>()
  const writes = []

  for (const block of plan.blocks) {
    placed.add(block.taskId)
    const before = current.get(block.taskId)
    if (before?.scheduledFor?.getTime() === block.start.getTime() && before.autoPlannedAt) continue
    writes.push(
      prisma.task.updateMany({
        where: { id: block.taskId, userId },
        data: {
          scheduledFor: block.start,
          schedulingStatus: 'scheduled',
          proposedSlotStart: block.start,
          proposedSlotEnd: block.end,
          autoPlannedAt: now,
        },
      })
    )
  }

  // Un bloc automatique a venir qui n'a plus de place est retire du planning
  // plutot que laisse sur un creneau devenu faux.
  let unscheduled = 0
  for (const task of plannable) {
    if (placed.has(task.id)) continue
    const before = current.get(task.id)
    if (!before?.scheduledFor || !before.autoPlannedAt) continue
    unscheduled++
    writes.push(
      prisma.task.updateMany({
        where: { id: task.id, userId },
        data: { scheduledFor: null, schedulingStatus: 'draft', proposedSlotStart: null, proposedSlotEnd: null, autoPlannedAt: null },
      })
    )
  }

  writes.push(prisma.user.update({ where: { id: userId }, data: { autoPlanRunAt: now } }))
  writes.push(
    prisma.productAnalyticsEvent.create({
      data: {
        userId,
        eventName: 'plan_generated',
        params: {
          reason,
          blocks: plan.summary.blockCount,
          minutes: plan.summary.totalMinutes,
          unplaced: plan.summary.unplacedCount,
          catchUp,
          busySources,
          timeZone,
        },
      },
    })
  )

  if (options.dryRun) {
    return {
      userId,
      reason,
      blocksWritten: writes.length - 2 - unscheduled,
      unscheduled,
      unplaced: plan.summary.unplacedCount,
      catchUp,
      busySources,
      unplacedReasons: plan.unplaced.reduce<Record<string, number>>((acc, u) => {
        acc[u.reason] = (acc[u.reason] ?? 0) + 1
        return acc
      }, {}),
      preview: {
        timeZone,
        blocks: plan.blocks.map((b) => ({ taskId: b.taskId, start: b.start.toISOString(), end: b.end.toISOString(), minutes: b.minutes })),
      },
    }
  }

  await prisma.$transaction(writes)

  return {
    userId,
    reason,
    blocksWritten: writes.length - 2 - unscheduled,
    unscheduled,
    unplaced: plan.summary.unplacedCount,
    catchUp,
    busySources,
  }
}

/**
 * Version pour les routes de l'app : ne fait jamais echouer la requete de
 * l'utilisateur, et ne la bloque pas plus de `timeoutMs`. Au-dela, la nuit
 * suivante rattrape.
 */
export async function replanUserSafely(
  userId: string,
  reason: ReplanReason,
  timeoutMs = 10_000
): Promise<ReplanResult | null> {
  try {
    return await withTimeout(replanUser(userId, reason), timeoutMs, null)
  } catch (error) {
    console.error(`[autoPlan] replanification ${reason} echouee pour ${userId}`, error)
    return null
  }
}
