/**
 * API pour replanifier un événement
 * POST /api/calendar/reschedule
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

    const { taskId, newStart, newEnd } = await req.json()

    // Validation
    if (!taskId || !newStart || !newEnd) {
      return NextResponse.json(
        { error: 'taskId, newStart et newEnd sont requis' },
        { status: 400 }
      )
    }

    // Récupérer la tâche et l'événement associé
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tâche non trouvée' },
        { status: 404 }
      )
    }

    const scheduledEvent = await prisma.scheduledTaskEvent.findFirst({
      where: { taskId, userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    const startDate = new Date(newStart)
    const endDate = new Date(newEnd)

    if (scheduledEvent && task.googleCalendarEventId) {
      // Mettre à jour l'événement existant
      const updated = await googleCalendarService.updateEvent(
        user.id,
        scheduledEvent.googleEventId,
        { start: startDate, end: endDate }
      )

      if (!updated) {
        return NextResponse.json(
          { error: 'Erreur mise à jour Google Calendar' },
          { status: 500 }
        )
      }

      // Mettre à jour en base
      await prisma.scheduledTaskEvent.update({
        where: { id: scheduledEvent.id },
        data: {
          startTime: startDate,
          endTime: endDate,
          rescheduledCount: { increment: 1 },
          reminderSentAt: null, // Reset pour renvoyer un rappel
          postCheckSentAt: null
        }
      })
    } else {
      // Créer un nouvel événement si pas d'existant
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

      // Créer l'entrée ScheduledTaskEvent
      await prisma.scheduledTaskEvent.create({
        data: {
          taskId,
          userId: user.id,
          googleEventId: result.eventId,
          startTime: startDate,
          endTime: endDate,
          rescheduledCount: scheduledEvent ? scheduledEvent.rescheduledCount + 1 : 0
        }
      })

      // Mettre à jour la tâche
      await prisma.task.update({
        where: { id: taskId },
        data: {
          googleCalendarEventId: result.eventId
        }
      })
    }

    // Mettre à jour la tâche
    await prisma.task.update({
      where: { id: taskId },
      data: {
        schedulingStatus: 'scheduled',
        scheduledFor: startDate,
        proposedSlotStart: startDate,
        proposedSlotEnd: endDate
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Événement replanifié',
      newSlot: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    })
  } catch (error) {
    console.error('Erreur /api/calendar/reschedule:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

