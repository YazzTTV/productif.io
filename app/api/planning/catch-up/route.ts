/**
 * Rattrapage des blocs non faits.
 *
 * GET  /api/planning/catch-up   apercu de la redistribution, n'ecrit rien
 * POST /api/planning/catch-up   applique la redistribution (premium)
 *
 * Contrairement a /api/planning/weekly-plan et /api/calendar/reschedule, cette
 * route ne DEPEND PAS de Google Calendar. Elle ecrit sur Task.scheduledFor, donc
 * elle marche pour un utilisateur qui n'a jamais connecte son agenda. Si l'agenda
 * est connecte et que le bloc a deja un evenement, on le deplace aussi, mais un
 * echec cote Google ne fait jamais echouer la replanification.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanInfo, buildLockedFeature } from '@/lib/plans'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'
import {
  planCatchUp,
  localDayIndex,
  fromLocalDayIndex,
  DEFAULT_HORIZON_DAYS,
  DEFAULT_DAILY_CAPACITY_MINUTES,
  DEFAULT_TASK_MINUTES,
  type CatchUpTask,
  type CatchUpPlan,
} from '@/lib/planning/CatchUpPlanner'

export const dynamic = 'force-dynamic'

const MAX_HORIZON_DAYS = 21
const MAX_CAPACITY_MINUTES = 16 * 60

function parseIntParam(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw === null) return fallback
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

/**
 * Les blocs a rattraper : prevus a une date deja passee et toujours pas termines.
 * Ca couvre naturellement les taches marquees not_done ou snoozed par
 * /api/calendar/respond, sans avoir a les enumerer.
 */
async function loadCatchUpContext(
  userId: string,
  now: Date,
  tzOffsetMinutes: number,
  horizonDays: number
) {
  const todayIndex = localDayIndex(now, tzOffsetMinutes)
  const todayStart = fromLocalDayIndex(todayIndex, 0, tzOffsetMinutes)
  const horizonEnd = fromLocalDayIndex(todayIndex + horizonDays, 0, tzOffsetMinutes)

  const [overdue, upcoming] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        completed: false,
        scheduledFor: { not: null, lt: todayStart },
      },
      include: { subject: { select: { id: true, name: true, deadline: true } } },
      orderBy: { scheduledFor: 'asc' },
    }),
    prisma.task.findMany({
      where: {
        userId,
        completed: false,
        scheduledFor: { gte: todayStart, lt: horizonEnd },
      },
      select: { scheduledFor: true, estimatedMinutes: true },
    }),
  ])

  const tasks: CatchUpTask[] = overdue.map((task) => ({
    id: task.id,
    title: task.title,
    subjectId: task.subjectId,
    subjectName: task.subject?.name ?? null,
    subjectDeadline: task.subject?.deadline ?? null,
    estimatedMinutes: task.estimatedMinutes,
    priority: task.priority,
    // Le where garantit scheduledFor non nul, mais Prisma le type nullable.
    scheduledFor: task.scheduledFor as Date,
  }))

  const existingLoad = upcoming
    .filter((task): task is { scheduledFor: Date; estimatedMinutes: number | null } =>
      task.scheduledFor !== null
    )
    .map((task) => ({
      scheduledFor: task.scheduledFor,
      estimatedMinutes: task.estimatedMinutes,
    }))

  // Les blocs qui ont deja un evenement dans l'agenda : eux seuls sont a deplacer
  // cote Google. Garde a part pour ne pas polluer le type d'entree du planificateur.
  const eventIdByTaskId = new Map<string, string>()
  for (const task of overdue) {
    if (task.googleCalendarEventId) {
      eventIdByTaskId.set(task.id, task.googleCalendarEventId)
    }
  }

  return { tasks, existingLoad, eventIdByTaskId }
}

function buildPlan(
  tasks: CatchUpTask[],
  existingLoad: { scheduledFor: Date; estimatedMinutes: number | null }[],
  now: Date,
  tzOffsetMinutes: number,
  horizonDays: number,
  dailyCapacityMinutes: number
): CatchUpPlan {
  return planCatchUp(tasks, {
    now,
    tzOffsetMinutes,
    horizonDays,
    dailyCapacityMinutes,
    existingLoad,
  })
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const params = req.nextUrl.searchParams
    const tzOffsetMinutes = parseIntParam(params.get('tzOffset'), 0, -14 * 60, 14 * 60)
    const horizonDays = parseIntParam(
      params.get('horizonDays'),
      DEFAULT_HORIZON_DAYS,
      1,
      MAX_HORIZON_DAYS
    )
    const dailyCapacityMinutes = parseIntParam(
      params.get('dailyCapacityMinutes'),
      DEFAULT_DAILY_CAPACITY_MINUTES,
      DEFAULT_TASK_MINUTES,
      MAX_CAPACITY_MINUTES
    )

    const now = new Date()
    const { tasks, existingLoad } = await loadCatchUpContext(
      user.id,
      now,
      tzOffsetMinutes,
      horizonDays
    )
    const plan = buildPlan(
      tasks,
      existingLoad,
      now,
      tzOffsetMinutes,
      horizonDays,
      dailyCapacityMinutes
    )
    const planInfo = getPlanInfo(user)

    return NextResponse.json({
      success: true,
      plan,
      canApply: planInfo.limits.catchUpMode === 'full',
      planLimits: planInfo.limits,
    })
  } catch (error) {
    console.error('Erreur GET /api/planning/catch-up:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const tzOffsetMinutes = Number.isFinite(body?.tzOffset)
      ? Math.min(14 * 60, Math.max(-14 * 60, Math.trunc(body.tzOffset)))
      : 0
    const horizonDays = Number.isFinite(body?.horizonDays)
      ? Math.min(MAX_HORIZON_DAYS, Math.max(1, Math.trunc(body.horizonDays)))
      : DEFAULT_HORIZON_DAYS
    const dailyCapacityMinutes = Number.isFinite(body?.dailyCapacityMinutes)
      ? Math.min(
          MAX_CAPACITY_MINUTES,
          Math.max(DEFAULT_TASK_MINUTES, Math.trunc(body.dailyCapacityMinutes))
        )
      : DEFAULT_DAILY_CAPACITY_MINUTES

    const planInfo = getPlanInfo(user)
    if (planInfo.limits.catchUpMode !== 'full') {
      return NextResponse.json(
        {
          error: 'La replanification automatique est réservée au plan premium',
          ...buildLockedFeature('catch_up'),
          plan: planInfo.plan,
          planLimits: planInfo.limits,
        },
        { status: 403 }
      )
    }

    const now = new Date()
    const { tasks, existingLoad, eventIdByTaskId } = await loadCatchUpContext(
      user.id,
      now,
      tzOffsetMinutes,
      horizonDays
    )

    if (tasks.length === 0) {
      return NextResponse.json({
        success: true,
        applied: false,
        plan: buildPlan(tasks, existingLoad, now, tzOffsetMinutes, horizonDays, dailyCapacityMinutes),
        tasksMoved: 0,
        calendarEventsMoved: 0,
        message: 'Aucun bloc à rattraper',
      })
    }

    const plan = buildPlan(
      tasks,
      existingLoad,
      now,
      tzOffsetMinutes,
      horizonDays,
      dailyCapacityMinutes
    )

    // On n'ecrit que les taches de CE plan, une par une, en reutilisant le userId
    // dans le where pour qu'une tache d'un autre utilisateur ne puisse pas etre
    // touchee meme si un identifiant fuitait.
    const results = await prisma.$transaction(
      plan.moves.map((move) =>
        prisma.task.updateMany({
          where: { id: move.taskId, userId: user.id },
          data: {
            scheduledFor: new Date(move.to),
            schedulingStatus: 'scheduled',
          },
        })
      )
    )
    const tasksMoved = results.reduce((sum, result) => sum + result.count, 0)

    // Google Calendar est un bonus, jamais une condition. Un echec ici laisse la
    // replanification en base intacte.
    let calendarEventsMoved = 0

    if (eventIdByTaskId.size > 0) {
      try {
        const connected = await googleCalendarService.isConnected(user.id)
        if (connected) {
          for (const move of plan.moves) {
            const eventId = eventIdByTaskId.get(move.taskId)
            if (!eventId) continue
            const start = new Date(move.to)
            const end = new Date(
              start.getTime() + move.minutes * 60_000
            )
            try {
              const updated = await googleCalendarService.updateEvent(user.id, eventId, {
                start,
                end,
              })
              if (updated) calendarEventsMoved++
            } catch (eventError) {
              console.warn(
                `[catch-up] deplacement Google Calendar echoue pour la tache ${move.taskId}:`,
                eventError
              )
            }
          }
        }
      } catch (calendarError) {
        console.warn('[catch-up] Google Calendar indisponible, replanification conservée:', calendarError)
      }
    }

    return NextResponse.json({
      success: true,
      applied: true,
      plan,
      tasksMoved,
      calendarEventsMoved,
      message:
        tasksMoved === 1
          ? '1 bloc replanifié'
          : `${tasksMoved} blocs replanifiés sur ${plan.summary.daysUsed} jour(s)`,
    })
  } catch (error) {
    console.error('Erreur POST /api/planning/catch-up:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
