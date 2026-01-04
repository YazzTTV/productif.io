/**
 * API pour répondre "fait/pas fait" après un événement
 * POST /api/calendar/respond
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'
import { findBestSlots } from '@/lib/calendar/SlotFinder'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { eventId, response, snoozeMinutes } = await req.json()

    // Validation
    if (!eventId || !response) {
      return NextResponse.json(
        { error: 'eventId et response sont requis' },
        { status: 400 }
      )
    }

    if (!['done', 'not_done', 'snoozed'].includes(response)) {
      return NextResponse.json(
        { error: 'response doit être done, not_done ou snoozed' },
        { status: 400 }
      )
    }

    // Récupérer l'événement
    const scheduledEvent = await prisma.scheduledTaskEvent.findFirst({
      where: { id: eventId, userId: user.id },
      include: { task: true }
    })

    if (!scheduledEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Traiter selon la réponse
    if (response === 'done') {
      // Marquer la tâche comme complétée
      await prisma.task.update({
        where: { id: scheduledEvent.taskId },
        data: {
          completed: true,
          schedulingStatus: 'done'
        }
      })

      // Mettre à jour l'événement
      await prisma.scheduledTaskEvent.update({
        where: { id: eventId },
        data: {
          userResponse: 'done',
          postCheckSentAt: new Date()
        }
      })

      // Ajouter de l'XP via la table XpEvent
      try {
        await prisma.xpEvent.create({
          data: {
            userId: user.id,
            type: 'task_complete',
            xpAwarded: 15,
            metadata: { source: 'calendar_scheduled' }
          }
        })
        
        // Mettre à jour le total XP de l'utilisateur
        await prisma.userGamification.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            totalXp: 15,
            points: 15
          },
          update: {
            totalXp: { increment: 15 },
            points: { increment: 15 }
          }
        })
      } catch (e) {
        console.warn('Erreur attribution XP:', e)
      }

      // Optionnel: mettre à jour la description dans Google Calendar
      await googleCalendarService.updateEvent(
        user.id,
        scheduledEvent.googleEventId,
        { description: `✅ Tâche complétée !\n\n${scheduledEvent.task.description || ''}` }
      )

      return NextResponse.json({
        success: true,
        message: 'Tâche marquée comme complétée ! +15 XP',
        xpAwarded: 15
      })

    } else if (response === 'not_done') {
      // Proposer une replanification
      await prisma.task.update({
        where: { id: scheduledEvent.taskId },
        data: { schedulingStatus: 'not_done' }
      })

      await prisma.scheduledTaskEvent.update({
        where: { id: eventId },
        data: {
          userResponse: 'not_done',
          postCheckSentAt: new Date()
        }
      })

      // Trouver de nouveaux créneaux
      const estimatedMinutes = scheduledEvent.task.estimatedMinutes || 30
      const result = await findBestSlots(
        user.id,
        estimatedMinutes,
        scheduledEvent.task.priority || 2,
        scheduledEvent.task.energyLevel || 1
      )

      return NextResponse.json({
        success: true,
        message: 'Pas de souci, on replanifie !',
        rescheduleOptions: result.slots.map(slot => ({
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          label: slot.label
        })),
        taskId: scheduledEvent.taskId
      })

    } else if (response === 'snoozed') {
      // Reporter de X minutes
      const minutes = snoozeMinutes || 30
      const newStart = new Date(Date.now() + minutes * 60 * 1000)
      const duration = scheduledEvent.endTime.getTime() - scheduledEvent.startTime.getTime()
      const newEnd = new Date(newStart.getTime() + duration)

      // Mettre à jour Google Calendar
      await googleCalendarService.updateEvent(
        user.id,
        scheduledEvent.googleEventId,
        { start: newStart, end: newEnd }
      )

      // Mettre à jour en base
      await prisma.scheduledTaskEvent.update({
        where: { id: eventId },
        data: {
          startTime: newStart,
          endTime: newEnd,
          userResponse: 'snoozed',
          rescheduledCount: { increment: 1 }
        }
      })

      await prisma.task.update({
        where: { id: scheduledEvent.taskId },
        data: {
          schedulingStatus: 'snoozed',
          scheduledFor: newStart,
          proposedSlotStart: newStart,
          proposedSlotEnd: newEnd
        }
      })

      return NextResponse.json({
        success: true,
        message: `Reporté de ${minutes} minutes`,
        newSlot: {
          start: newStart.toISOString(),
          end: newEnd.toISOString()
        }
      })
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })

  } catch (error) {
    console.error('Erreur /api/calendar/respond:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

