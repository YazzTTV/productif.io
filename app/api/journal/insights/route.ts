import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiAuth } from '@/middleware/api-auth'
import { generateDailyInsights } from '@/lib/ai/daily-insights'

function normalizeToDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(req: NextRequest) {
  const authResponse = await apiAuth(req, { requiredScopes: ['journal:read'] })
  if (authResponse) return authResponse

  try {
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date') || new Date().toISOString()
    const userId = req.headers.get('x-api-user-id')!

    const insightDate = normalizeToDay(new Date(dateParam))

    let insight = await prisma.dailyInsight.findUnique({
      where: { userId_date: { userId, date: insightDate } }
    })

    if (!insight) {
      const { recommendations, focusAreas } = await generateDailyInsights(userId, 7)

      const recentJournals = await prisma.journalEntry.findMany({
        where: { userId, processed: true, date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { id: true }
      })

      insight = await prisma.dailyInsight.create({
        data: {
          userId,
          date: insightDate,
          recommendations,
          focusAreas,
          basedOnDays: 7,
          journalEntries: recentJournals.map(j => j.id)
        }
      })
    }

    return NextResponse.json({ insight })
  } catch (error: any) {
    console.error('GET /api/journal/insights error:', error)
    return NextResponse.json({ error: error?.message || 'Erreur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authResponse = await apiAuth(req, { requiredScopes: ['journal:write'] })
  if (authResponse) return authResponse

  try {
    const userId = req.headers.get('x-api-user-id')!
    const today = normalizeToDay(new Date())

    const { recommendations, focusAreas } = await generateDailyInsights(userId, 7)

    const recentJournals = await prisma.journalEntry.findMany({
      where: { userId, processed: true, date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { id: true }
    })

    const insight = await prisma.dailyInsight.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        recommendations,
        focusAreas,
        basedOnDays: 7,
        journalEntries: recentJournals.map(j => j.id)
      },
      update: {
        recommendations,
        focusAreas,
        journalEntries: recentJournals.map(j => j.id)
      }
    })

    return NextResponse.json({ insight })
  } catch (error: any) {
    console.error('POST /api/journal/insights error:', error)
    return NextResponse.json({ error: error?.message || 'Erreur' }, { status: 500 })
  }
}


