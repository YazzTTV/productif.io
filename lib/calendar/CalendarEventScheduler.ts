/**
 * Scheduler pour surveiller les événements Google Calendar
 * - Envoie des rappels au démarrage des événements
 * - Demande "fait/pas fait" à la fin
 */

import cron, { ScheduledTask } from 'node-cron'
import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/apns'

export class CalendarEventScheduler {
  private pollingJob: ScheduledTask | null = null
  private isStarted: boolean = false

  /**
   * Démarre le scheduler
   */
  start() {
    if (this.isStarted) {
      console.log('⚠️ CalendarEventScheduler déjà démarré')
      return
    }

    console.log('🗓️ Démarrage du CalendarEventScheduler...')

    // Polling toutes les 2 minutes
    this.pollingJob = cron.schedule('*/2 * * * *', async () => {
      try {
        await this.checkUpcomingEvents()
        await this.checkEndedEvents()
      } catch (error) {
        console.error('❌ Erreur CalendarEventScheduler polling:', error)
      }
    })

    this.isStarted = true
    console.log('✅ CalendarEventScheduler démarré (polling toutes les 2 min)')
  }

  /**
   * Arrête le scheduler
   */
  stop() {
    if (this.pollingJob) {
      this.pollingJob.stop()
      this.pollingJob = null
    }
    this.isStarted = false
    console.log('🛑 CalendarEventScheduler arrêté')
  }

  /**
   * Vérifie les événements qui commencent dans les 5 prochaines minutes
   */
  async checkUpcomingEvents() {
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    const events = await prisma.scheduledTaskEvent.findMany({
      where: {
        startTime: {
          gte: now,
          lte: fiveMinutesFromNow
        },
        reminderSentAt: null,
        userResponse: null // Pas encore de réponse
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            estimatedMinutes: true
          }
        }
      }
    })

    for (const event of events) {
      await this.sendStartReminder(event)
    }

    if (events.length > 0) {
      console.log(`📢 ${events.length} rappel(s) de début envoyé(s)`)
    }
  }

  /**
   * Vérifie les événements terminés depuis 2-5 minutes (sans réponse)
   */
  async checkEndedEvents() {
    const now = new Date()
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000)
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)

    const events = await prisma.scheduledTaskEvent.findMany({
      where: {
        endTime: {
          gte: tenMinutesAgo,
          lte: twoMinutesAgo
        },
        postCheckSentAt: null,
        userResponse: null
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            completed: true
          }
        }
      }
    })

    for (const event of events) {
      // Ne pas demander si la tâche est déjà complétée
      if (!event.task.completed) {
        await this.sendPostCheck(event)
      } else {
        // Marquer comme traité
        await prisma.scheduledTaskEvent.update({
          where: { id: event.id },
          data: {
            postCheckSentAt: new Date(),
            userResponse: 'done'
          }
        })
      }
    }

    if (events.length > 0) {
      console.log(`📢 ${events.length} post-check(s) envoyé(s)`)
    }
  }

  /**
   * Envoie un rappel de début d'événement
   */
  private async sendStartReminder(event: any) {
    const { userId, task } = event

    try {
      // Récupérer les paramètres de notification
      const settings = await prisma.notificationSettings.findUnique({
        where: { userId }
      })

      if (!settings?.isEnabled || !settings?.pushEnabled) {
        console.log(`⏭️ Notifications désactivées pour ${userId}`)
        return
      }

      // Envoyer la notification push
      const durationText = task.estimatedMinutes 
        ? `${task.estimatedMinutes} min` 
        : 'durée non définie'

      await sendPushNotification(userId, {
        title: "⏰ C'est l'heure !",
        body: `${task.title} - ${durationText}`,
        data: {
          type: 'calendar_start',
          taskId: task.id,
          eventId: event.id
        }
      })

      // Marquer comme envoyé
      await prisma.scheduledTaskEvent.update({
        where: { id: event.id },
        data: { reminderSentAt: new Date() }
      })

      console.log(`✅ Rappel début envoyé: ${task.title}`)

    } catch (error) {
      console.error(`❌ Erreur envoi rappel début pour ${task.title}:`, error)
    }
  }

  /**
   * Envoie le prompt "fait/pas fait" après la fin d'un événement
   */
  private async sendPostCheck(event: any) {
    const { userId, task } = event

    try {
      // Récupérer les paramètres de notification
      const settings = await prisma.notificationSettings.findUnique({
        where: { userId }
      })

      if (!settings?.isEnabled || !settings?.pushEnabled) {
        console.log(`⏭️ Notifications désactivées pour ${userId}`)
        return
      }

      // Envoyer la notification push
      await sendPushNotification(userId, {
        title: "✅ Tâche terminée ?",
        body: `Tu as terminé "${task.title}" ?`,
        data: {
          type: 'calendar_post_check',
          taskId: task.id,
          eventId: event.id,
          actions: ['done', 'not_done', 'snoozed']
        }
      })

      // Stocker l'état conversationnel pour attendre la réponse
      await prisma.userConversationState.upsert({
        where: { userId },
        create: {
          userId,
          state: 'awaiting_task_completion',
          data: {
            eventId: event.id,
            taskId: task.id,
            taskTitle: task.title
          }
        },
        update: {
          state: 'awaiting_task_completion',
          data: {
            eventId: event.id,
            taskId: task.id,
            taskTitle: task.title
          }
        }
      })

      // Marquer comme envoyé
      await prisma.scheduledTaskEvent.update({
        where: { id: event.id },
        data: { postCheckSentAt: new Date() }
      })

      console.log(`✅ Post-check envoyé: ${task.title}`)

    } catch (error) {
      console.error(`❌ Erreur envoi post-check pour ${task.title}:`, error)
    }
  }

  /**
   * Retourne le statut du scheduler
   */
  getStatus() {
    return {
      isStarted: this.isStarted,
      nextRun: this.isStarted ? 'Dans ~2 minutes' : 'Arrêté'
    }
  }
}

// Instance singleton
export const calendarEventScheduler = new CalendarEventScheduler()

