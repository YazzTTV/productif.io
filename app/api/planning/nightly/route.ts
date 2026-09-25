/**
 * Recalcul de nuit du planning de revisions.
 *
 * GET  /api/planning/nightly   appele par le cron Vercel (vercel.json), en-tete
 *                              Authorization: Bearer $CRON_SECRET
 * POST /api/planning/nightly   meme chose a la main, en-tete x-scheduler-key
 *
 * Traite chaque utilisateur qui a des chapitres non termines et dont le planning
 * n'a pas ete recalcule depuis 20 h. Le cron tourne une fois par jour a 4h UTC,
 * soit 6h a Paris et minuit a Montreal : le planning est pret avant le reveil.
 *
 * Ferme par defaut : sans secret configure, la route refuse tout.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { replanUser, type ReplanResult } from '@/lib/planning/autoPlan'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MIN_INTERVAL_MS = 20 * 60 * 60 * 1000
const TIME_BUDGET_MS = 50 * 1000

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  const schedulerKey = process.env.SCHEDULER_API_KEY
  const bearer = req.headers.get('authorization')
  const key = req.headers.get('x-scheduler-key')
  if (cronSecret && bearer === `Bearer ${cronSecret}`) return true
  if (schedulerKey && key === schedulerKey) return true
  return false
}

async function run(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const startedAt = Date.now()
  const now = new Date()
  const force = req.nextUrl.searchParams.get('force') === '1'

  const candidates = await prisma.task.findMany({
    // Les comptes supprimes gardent leurs taches sous une adresse +deleted : on les ignore.
    where: { completed: false, subjectId: { not: null }, user: { email: { not: { endsWith: '+deleted@productif.io' } } } },
    distinct: ['userId'],
    select: { userId: true, user: { select: { autoPlanRunAt: true } } },
  })

  const due = candidates
    .filter((c) => force || !c.user.autoPlanRunAt || now.getTime() - c.user.autoPlanRunAt.getTime() >= MIN_INTERVAL_MS)
    .map((c) => c.userId)

  const results: ReplanResult[] = []
  const failures: { userId: string; error: string }[] = []
  let deferred = 0

  for (const userId of due) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      deferred = due.length - results.length - failures.length
      break
    }
    try {
      results.push(await replanUser(userId, 'nightly', new Date()))
    } catch (error) {
      failures.push({ userId, error: error instanceof Error ? error.message : String(error) })
    }
  }

  const summary = {
    candidates: candidates.length,
    processed: results.length,
    failed: failures.length,
    deferred,
    blocksWritten: results.reduce((sum, r) => sum + r.blocksWritten, 0),
    catchUpUsers: results.filter((r) => r.catchUp).length,
    durationMs: Date.now() - startedAt,
  }
  console.log('[planning/nightly]', JSON.stringify(summary), failures.length ? JSON.stringify(failures) : '')

  return NextResponse.json({ success: failures.length === 0, summary, failures })
}

export async function GET(req: NextRequest) {
  return run(req)
}

export async function POST(req: NextRequest) {
  return run(req)
}
