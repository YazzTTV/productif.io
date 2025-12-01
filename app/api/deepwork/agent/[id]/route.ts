import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiToken, hasRequiredScopes } from '@/lib/api-token'
import { getAuthUserFromRequest, getAuthUser } from '@/lib/auth'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
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

    // 2) Si pas d'utilisateur web, essayer avec un token API explicite
    if (!userId && token) {
      const payload = await verifyApiToken(token)
      if (!payload) {
        return NextResponse.json({ error: 'Token API invalide ou expiré' }, { status: 401 })
      }
      if (!hasRequiredScopes(payload.scopes, ['deepwork:write', 'tasks:write'])) {
        return NextResponse.json({ error: 'Permissions insuffisantes', requiredScopes: ['deepwork:write', 'tasks:write'] }, { status: 403 })
      }
      userId = payload.userId
    }

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    const { action, notes } = await req.json()
    const sessionId = id

    const session = await prisma.deepWorkSession.findFirst({
      where: { id: sessionId, userId },
      include: { timeEntry: true }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    const now = new Date()
    let updateData: any = { updatedAt: now }
    let timeEntryUpdate: any = {}

    switch (action) {
      case 'complete': {
        updateData = { status: 'completed', notes }
        timeEntryUpdate = { endTime: now }
        break
      }
      case 'pause': {
        if (session.status !== 'active') {
          return NextResponse.json({ error: "La session n'est pas active" }, { status: 400 })
        }
        updateData.status = 'paused'
        break
      }
      case 'resume': {
        if (session.status !== 'paused') {
          return NextResponse.json({ error: "La session n'est pas en pause" }, { status: 400 })
        }
        updateData.status = 'active'
        break
      }
      case 'cancel': {
        updateData.status = 'cancelled'
        await prisma.timeEntry.delete({ where: { id: session.timeEntry.id } })
        // Cascade supprimera DeepWorkSession
        return NextResponse.json({ message: 'Session annulée et supprimée' })
      }
      case 'add_interruption': {
        updateData.interruptions = session.interruptions + 1
        break
      }
      default:
        return NextResponse.json({ error: 'Action non reconnue. Actions: complete, pause, resume, cancel, add_interruption' }, { status: 400 })
    }

    const updatedSession = await prisma.deepWorkSession.update({
      where: { id: sessionId },
      data: updateData,
      include: { timeEntry: true }
    })

    if (Object.keys(timeEntryUpdate).length > 0) {
      await prisma.timeEntry.update({ where: { id: session.timeEntry.id }, data: timeEntryUpdate })
    }

    let actualDuration: number | null = null
    if (action === 'complete') {
      actualDuration = Math.floor((now.getTime() - session.timeEntry.startTime.getTime()) / 60000)
    }

    return NextResponse.json({ session: updatedSession, actualDuration, message: `Session ${action === 'complete' ? 'terminée' : 'mise à jour'}` })
  } catch (error: any) {
    console.error('Erreur mise à jour session:', error)
    return NextResponse.json({ error: 'Erreur serveur', details: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const { id } = await context.params
    const sessionId = id
    const userId = payload.userId

    const session = await prisma.deepWorkSession.findFirst({
      where: { id: sessionId, userId },
      include: { timeEntry: { include: { task: true, project: true } } }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    if (session.status === 'active') {
      const elapsed = Math.floor((Date.now() - session.timeEntry.startTime.getTime()) / 60000)
      return NextResponse.json({ session: { ...session, elapsedMinutes: elapsed } })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Erreur récupération session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


