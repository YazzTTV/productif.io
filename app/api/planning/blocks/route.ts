/**
 * Les blocs de revision a venir de l'utilisateur.
 *
 * GET /api/planning/blocks?days=14
 *
 * Sert au mobile pour afficher le planning, ecrire les blocs dans le calendrier
 * Apple et programmer les rappels locaux. Renvoie les chapitres dates et non
 * termines, qu'ils aient ete places par le planificateur automatique ou a la main,
 * a partir du debut du jour local.
 *
 * Apres la reponse, verifie que l'agenda Google n'a pas pris un creneau deja
 * occupe par un bloc, et replanifie si c'est le cas (voir googleOverlap.ts).
 * Le mobile voit les blocs deplaces a sa prochaine lecture.
 */

import { NextRequest, NextResponse, after } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTimezone } from '@/lib/timezone'
import { localDateKey, localTime } from '@/lib/planning/StudyPlanner'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'
import { replanUserSafely } from '@/lib/planning/autoPlan'
import { hasBusyOverlap, upcomingBlocks, type TimedBlock } from '@/lib/planning/googleOverlap'

export const dynamic = 'force-dynamic'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DEFAULT_MINUTES = 30
/**
 * Pas plus d'une replanification « Google » toutes les 5 min par compte. Si la
 * lecture de Google echoue pendant la replanification, le chevauchement reste,
 * et sans ce garde chaque ouverture de l'accueil relancerait un recalcul.
 */
const GOOGLE_RECHECK_MS = 5 * 60 * 1000

async function replanIfGoogleOverlaps(userId: string, blocks: TimedBlock[], lastRunAt: Date | null) {
  try {
    const now = Date.now()
    if (lastRunAt && now - lastRunAt.getTime() < GOOGLE_RECHECK_MS) return
    const upcoming = upcomingBlocks(blocks, now)
    if (upcoming.length === 0) return
    if (!(await googleCalendarService.isConnected(userId))) return
    const until = new Date(Math.max(...upcoming.map((b) => new Date(b.end).getTime())))
    const busy = await googleCalendarService.getBusyTimes(userId, new Date(now), until)
    if (!hasBusyOverlap(upcoming, busy, now)) return
    // Prise du creneau atomique : deux lectures des blocs arrivees ensemble
    // replanifiaient deux fois a la meme seconde (25 septembre, 15:50:14). Seule
    // la requete qui fait passer autoPlanRunAt replanifie ; replanUser le
    // reecrit de toute facon a la fin.
    const claimed = await prisma.user.updateMany({
      where: {
        id: userId,
        OR: [{ autoPlanRunAt: null }, { autoPlanRunAt: { lt: new Date(now - GOOGLE_RECHECK_MS) } }],
      },
      data: { autoPlanRunAt: new Date(now) },
    })
    if (claimed.count === 0) return
    const result = await replanUserSafely(userId, 'google_changed')
    console.log(`[planning/blocks] agenda Google change pour ${userId}, replanifie :`, result?.blocksWritten ?? 'echec')
  } catch (error) {
    console.error('[planning/blocks] verification Google impossible', error)
  }
}

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

  // Apres la reponse : l'accueil ne doit pas attendre Google. `after` est tenu
  // par Vercel jusqu'au bout, contrairement a une promesse non attendue, que le
  // gel de la fonction tuait (panne de notifications du 15 septembre).
  after(() => replanIfGoogleOverlaps(user.id, blocks, record?.autoPlanRunAt ?? null))

  return NextResponse.json({
    success: true,
    timeZone,
    lastPlannedAt: record?.autoPlanRunAt?.toISOString() ?? null,
    blocks,
  })
}
