import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiToken, hasRequiredScopes } from '@/lib/api-token'
import { getAuthUserFromRequest, getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
    
    let userId: string | null = null

    // 1) Essayer d'abord via l'utilisateur authentifié (cookies ou header)
    const webUser = await getAuthUserFromRequest(req)
    if (webUser) {
      userId = webUser.id
    } else {
      const cookieUser = await getAuthUser()
      if (cookieUser) {
        userId = cookieUser.id
      }
    }
    
    // 2) Si pas d'utilisateur web, essayer avec un token API explicite (flows machine-to-machine)
    if (!userId && token) {
      try {
        const payload = await verifyApiToken(token)
        if (payload) {
          // Vérifier les scopes pour les tokens API
          if (!hasRequiredScopes(payload.scopes, ['deepwork:write', 'tasks:write'])) {
            return NextResponse.json({ error: 'Permissions insuffisantes', requiredScopes: ['deepwork:write', 'tasks:write'] }, { status: 403 })
          }
          userId = payload.userId
        }
      } catch (error) {
        // Si la vérification du token API échoue, on continue avec null
        // Cela permet de retourner une erreur 401 claire
        console.error('Erreur lors de la vérification du token API:', error)
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    const { plannedDuration, type = 'deepwork', description, taskId } = await req.json()

    if (!plannedDuration || plannedDuration < 1) {
      return NextResponse.json({ error: 'plannedDuration requis (en minutes)' }, { status: 400 })
    }

    // Vérifier que la tâche existe et appartient à l'utilisateur si taskId fourni
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: { id: taskId, userId, completed: false }
      })
      if (!task) {
        return NextResponse.json({ error: 'Tâche introuvable ou déjà complétée' }, { status: 404 })
      }
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
        taskId: taskId || null,
        description: description || (taskId ? undefined : `Session Deep Work (${plannedDuration}min)`)
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
    
    let userId: string | null = null

    // 1) Essayer d'abord via l'utilisateur authentifié (cookies ou header)
    const webUser = await getAuthUserFromRequest(req)
    if (webUser) {
      userId = webUser.id
    } else {
      const cookieUser = await getAuthUser()
      if (cookieUser) {
        userId = cookieUser.id
      }
    }
    
    // 2) Si pas d'utilisateur, essayer avec un token API
    if (!userId && token) {
      try {
        const payload = await verifyApiToken(token)
        if (payload) {
          // Vérifier les scopes pour les tokens API
          if (!hasRequiredScopes(payload.scopes, ['deepwork:read', 'tasks:read'])) {
            return NextResponse.json({ error: 'Permissions insuffisantes', requiredScopes: ['deepwork:read', 'tasks:read'] }, { status: 403 })
          }
          userId = payload.userId
        }
      } catch (error) {
        // Si la vérification du token API échoue, on continue avec null
        // Cela permet de retourner une erreur 401 claire
        console.error('Erreur lors de la vérification du token API:', error)
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }
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


