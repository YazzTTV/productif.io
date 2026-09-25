/**
 * Les blocs de revision a venir de l'utilisateur.
 *
 * GET /api/planning/blocks?days=14
 *
 * Sert au mobile pour afficher le planning, ecrire les blocs dans le calendrier
 * Apple et programmer les rappels locaux. Renvoie les chapitres dates et non
 * termines, qu'ils aient ete places par le planificateur automatique ou a la main,
 * a partir du debut du jour local.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTimezone } from '@/lib/timezone'
import { localDateKey, localTime } from '@/lib/planning/StudyPlanner'

export const dynamic = 'force-dynamic'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DEFAULT_MINUTES = 30

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const rawDays = Number.parseInt(req.nextUrl.searchParams.get('days') ?? '14', 10)
  const days = Number.isFinite(rawDays) ? Math.min(31, Math.max(1, rawDays)) : 14

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { timezone: true, autoPlanRunAt: true },
  })
  const timeZone = resolveTimezone(record ?? {})
  const todayStart = localTime(localDateKey(new Date(), timeZone), '00:00', timeZone)
  const rangeEnd = new Date(todayStart.getTime() + days * MS_PER_DAY)

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
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

  const blocks = tasks.map((task) => {
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

  return NextResponse.json({
    success: true,
    timeZone,
    lastPlannedAt: record?.autoPlanRunAt?.toISOString() ?? null,
    blocks,
  })
}
