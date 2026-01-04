/**
 * API pour planifier une tâche dans Google Calendar
 * POST /api/calendar/schedule
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { taskId, start, end, timezone } = await req.json()

    // Validation
    if (!taskId || !start || !end) {
      return NextResponse.json(
        { error: 'taskId, start et end sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que la tâche appartient à l'utilisateur
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tâche non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur a connecté Google Calendar
    const hasCalendar = await googleCalendarService.isConnected(user.id)
    if (!hasCalendar) {
      return NextResponse.json(
        { error: 'Google Calendar non connecté' },
        { status: 400 }
      )
    }

    const startDate = new Date(start)
    const endDate = new Date(end)

    // Créer l'événement dans Google Calendar
    const result = await googleCalendarService.createProductifEvent(
      user.id,
      taskId,
      task.title,
      startDate,
      endDate,
      task.description || undefined
    )

    if (!result.success || !result.eventId) {
      return NextResponse.json(
        { error: result.error || 'Erreur création événement' },
        { status: 500 }
      )
    }

    // Mettre à jour la tâche avec l'ID de l'événement
    await prisma.task.update({
      where: { id: taskId },
      data: {
        googleCalendarEventId: result.eventId,
        schedulingStatus: 'scheduled',
        scheduledFor: startDate,
        proposedSlotStart: startDate,
        proposedSlotEnd: endDate
      }
    })

    // Créer l'entrée ScheduledTaskEvent pour le tracking
    const scheduledEvent = await prisma.scheduledTaskEvent.create({
      data: {
        taskId,
        userId: user.id,
        googleEventId: result.eventId,
        startTime: startDate,
        endTime: endDate
      }
    })

    return NextResponse.json({
      success: true,
      eventId: result.eventId,
      scheduledEvent: {
        id: scheduledEvent.id,
        startTime: scheduledEvent.startTime,
        endTime: scheduledEvent.endTime
      }
    })
  } catch (error) {
    console.error('Erreur /api/calendar/schedule:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * GET - Récupérer les événements planifiés de l'utilisateur
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const upcoming = searchParams.get('upcoming') === 'true'

    const where: any = { userId: user.id }

    if (upcoming) {
      where.startTime = { gte: new Date() }
    }

    const events = await prisma.scheduledTaskEvent.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            priority: true,
            energyLevel: true,
            estimatedMinutes: true
          }
        }
      },
      orderBy: { startTime: 'asc' },
      take: 20
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Erreur GET /api/calendar/schedule:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

