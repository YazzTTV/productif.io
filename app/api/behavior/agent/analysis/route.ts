import { NextRequest, NextResponse } from 'next/server'
import { verifyApiTokenFromRequest } from '@/middleware/api-auth'
import { analyzeBehaviorPatterns } from '@/lib/ai/behavior-analysis.service'
import { prisma } from '@/lib/prisma'

// GET : récupérer ou générer l'analyse
export async function GET(req: NextRequest) {
  const verification = await verifyApiTokenFromRequest(req, ['behavior:read'])
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '7')
  const userId = verification.payload.userId

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const endDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  // Chercher analyse existante récente
  let pattern = await prisma.behaviorPattern.findFirst({
    where: {
      userId,
      startDate: { gte: startDate },
      endDate: { lte: endDate }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Générer si pas trouvée ou trop ancienne (> 24h)
  if (!pattern || new Date().getTime() - pattern.createdAt.getTime() > 24 * 60 * 60 * 1000) {
    const analysis = await analyzeBehaviorPatterns(userId, days)

    pattern = await prisma.behaviorPattern.create({
      data: {
        userId,
        startDate,
        endDate,
        patterns: analysis.patterns,
        avgMood: analysis.averages.mood,
        avgFocus: analysis.averages.focus,
        avgMotivation: analysis.averages.motivation,
        avgEnergy: analysis.averages.energy,
        avgStress: analysis.averages.stress,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        correlations: analysis.correlations
      }
    })
  }

  return NextResponse.json({ pattern })
}

// POST : forcer la régénération
export async function POST(req: NextRequest) {
  const verification = await verifyApiTokenFromRequest(req, ['behavior:write'])
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error }, { status: 401 })
  }

  const { days = 7 } = await req.json()
  const userId = verification.payload.userId

  const analysis = await analyzeBehaviorPatterns(userId, days)

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const endDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  const pattern = await prisma.behaviorPattern.create({
    data: {
      userId,
      startDate,
      endDate,
      patterns: analysis.patterns,
      avgMood: analysis.averages.mood,
      avgFocus: analysis.averages.focus,
      avgMotivation: analysis.averages.motivation,
      avgEnergy: analysis.averages.energy,
      avgStress: analysis.averages.stress,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      correlations: analysis.correlations
    }
  })

  return NextResponse.json({ pattern })
}
