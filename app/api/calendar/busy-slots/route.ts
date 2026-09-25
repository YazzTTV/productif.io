/**
 * Creneaux occupes lus sur le telephone.
 *
 * POST /api/calendar/busy-slots
 *   { source: "apple", rangeStart: ISO, rangeEnd: ISO, slots: [{ start: ISO, end: ISO }] }
 *
 * Apple Calendar n'est lisible que sur l'appareil (EventKit), le serveur ne peut
 * pas le lire comme il lit Google. L'app envoie donc les creneaux occupes des
 * prochains jours, SANS titre ni lieu : seulement des heures. Si l'instantane a
 * change, le planning est recalcule dans la foulee.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { replanUserSafely } from '@/lib/planning/autoPlan'

export const dynamic = 'force-dynamic'

const MAX_SLOTS = 500
const MAX_RANGE_MS = 31 * 24 * 60 * 60 * 1000
const ALLOWED_SOURCES = new Set(['apple'])

function toDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const source = typeof body?.source === 'string' ? body.source : ''
  const rangeStart = toDate(body?.rangeStart)
  const rangeEnd = toDate(body?.rangeEnd)

  if (!ALLOWED_SOURCES.has(source) || !rangeStart || !rangeEnd || rangeEnd <= rangeStart) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
  if (rangeEnd.getTime() - rangeStart.getTime() > MAX_RANGE_MS) {
    return NextResponse.json({ error: 'Plage trop longue (31 jours maximum)' }, { status: 400 })
  }
  if (!Array.isArray(body?.slots) || body.slots.length > MAX_SLOTS) {
    return NextResponse.json({ error: `slots doit être une liste de ${MAX_SLOTS} créneaux maximum` }, { status: 400 })
  }

  const slots = body.slots
    .map((slot: any) => ({ start: toDate(slot?.start), end: toDate(slot?.end) }))
    .filter((slot: { start: Date | null; end: Date | null }) => slot.start && slot.end && slot.end > slot.start)
    .map((slot: { start: Date; end: Date }) => ({ start: slot.start.toISOString(), end: slot.end.toISOString() }))
    .sort((a: { start: string }, b: { start: string }) => a.start.localeCompare(b.start))

  const previous = await prisma.calendarBusySnapshot.findUnique({ where: { userId: user.id } })
  const changed = !previous || JSON.stringify(previous.slots) !== JSON.stringify(slots)

  await prisma.calendarBusySnapshot.upsert({
    where: { userId: user.id },
    create: { userId: user.id, source, rangeStart, rangeEnd, slots },
    update: { source, rangeStart, rangeEnd, slots },
  })

  const replan = changed ? await replanUserSafely(user.id, 'busy_slots') : null

  return NextResponse.json({ success: true, stored: slots.length, changed, replanned: !!replan })
}
