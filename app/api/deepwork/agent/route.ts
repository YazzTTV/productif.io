import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiToken, hasRequiredScopes } from '@/lib/api-token'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
    if (!token) {
      return NextResponse.json({ error: 'Un token API est requis' }, { status: 401 })
    }

    const payload = await verifyApiToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token API invalide ou expiré' }, { status: 401 })
    }
    if (!hasRequiredScopes(payload.scopes, ['deepwork:write', 'tasks:write'])) {
      return NextResponse.json({ error: 'Permissions insuffisantes', requiredScopes: ['deepwork:write', 'tasks:write'] }, { status: 403 })
    }

    const { plannedDuration, type = 'deepwork', description } = await req.json()
    const userId = payload.userId

    if (!plannedDuration || plannedDuration < 1) {
      return NextResponse.json({ error: 'plannedDuration requis (en minutes)' }, { status: 400 })
    }

    const activeSession = await prisma.deepWorkSession.findFirst({
      where: { userId, status: 'active' },
      include: { timeEntry: true }
    })

    if (activeSession) {
      const elapsed = Math.floor((Date.now() - activeSession.timeEntry.startTime.getTime()) / 60000)
      return NextResponse.json({
        error: 'Une session est déjà en cours',
        session: { ...activeSession, elapsedMinutes: elapsed },
      }, { status: 400 })
    }

    const startTime = new Date()
    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId,
        startTime,
        description: description || `Session Deep Work (${plannedDuration}min)`
      }
    })

    const session = await prisma.deepWorkSession.create({
      data: {
        userId,
        timeEntryId: timeEntry.id,
        plannedDuration,
        type,
        status: 'active'
      },
      include: { timeEntry: true }
    })

    const endTimeExpected = new Date(startTime.getTime() + plannedDuration * 60000)
    return NextResponse.json({ session, message: `Session Deep Work lancée pour ${plannedDuration} minutes`, endTimeExpected: endTimeExpected.toISOString() }, { status: 201 })
  } catch (error: any) {
    console.error('Erreur création session Deep Work:', error)
    return NextResponse.json({ error: 'Erreur serveur', details: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
    if (!token) {
      return NextResponse.json({ error: 'Un token API est requis' }, { status: 401 })
    }

    const payload = await verifyApiToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token API invalide ou expiré' }, { status: 401 })
    }
    if (!hasRequiredScopes(payload.scopes, ['deepwork:read', 'tasks:read'])) {
      return NextResponse.json({ error: 'Permissions insuffisantes', requiredScopes: ['deepwork:read', 'tasks:read'] }, { status: 403 })
    }

    const userId = payload.userId
    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get('status') // active, completed, all
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = { userId }
    if (statusParam && statusParam !== 'all') {
      where.status = statusParam
    }

    const sessions = await prisma.deepWorkSession.findMany({
      where,
      include: {
        timeEntry: {
          include: { task: true, project: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const enriched = sessions.map((s) => {
      if (s.status === 'active') {
        const elapsed = Math.floor((Date.now() - s.timeEntry.startTime.getTime()) / 60000)
        return { ...s, elapsedMinutes: elapsed }
      }
      return s
    })

    return NextResponse.json({ sessions: enriched })
  } catch (error) {
    console.error('Erreur récupération sessions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


