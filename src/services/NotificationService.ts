import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import NotificationLogger from './NotificationLogger'
import NotificationContentBuilder from './NotificationContentBuilder'
import { getNotificationTitle } from './notification-titles.js'

class NotificationService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async processNotifications() {
    try {
      const now = new Date()
      // Arrondir à la minute
      now.setSeconds(0, 0)
      const oneMinuteFromNow = new Date(now)
      oneMinuteFromNow.setMinutes(now.getMinutes() + 1)

      const notifications = await this.prisma.notificationHistory.findMany({
        where: {
          status: 'pending',
          scheduledFor: {
            gte: now,
            lt: oneMinuteFromNow
          }
        },
        include: {
          user: {
            include: {
              notificationSettings: true
            }
          }
        }
      })


      for (const notification of notifications) {
        try {
          await this.processNotification(notification)
        } catch (error) {
          NotificationLogger.logError(`Traitement de la notification ${notification.id}`, error)
        }
      }
    } catch (error) {
      NotificationLogger.logError('Traitement des notifications', error)
    }
  }

  async processNotification(notification: any) {
    NotificationLogger.logNotificationProcessing(notification)

    try {
      const now = new Date()
      
      // Vérifier si l'utilisateur accepte les notifications à cette heure
      if (!this.canSendNotification(notification.user.notificationSettings, now)) {
        return
      }

      // Vérifier les canaux de notification disponibles (push only)
      const settings = notification.user.notificationSettings
      const canSendPush = !!settings?.pushEnabled

      if (!canSendPush) {
        NotificationLogger.logError('Configuration notification', new Error('Aucun canal push disponible pour l\'utilisateur'))
        await this.prisma.notificationHistory.update({
          where: { id: notification.id },
          data: {
            status: 'failed',
            error: 'Aucun canal push disponible'
          }
        })
        return
      }

      try {
        const { sendPushNotification } = await import('../../lib/push-notifications.js')
        const title = notification.pushTitle || getNotificationTitle(notification.type)
        const body = notification.pushBody || this.extractBodyFromContent(notification.content)

        const pushData = {
          notificationId: notification.id,
          type: notification.type,
          action: notification.type === 'JOURNAL_PROMPT' ? 'open_journal' : 'open_assistant',
          message: notification.assistantMessage || notification.content
        }

        await sendPushNotification(notification.userId, {
          title,
          body,
          sound: 'default',
          data: pushData
        })
      } catch (pushError) {
        NotificationLogger.logError('Envoi push', pushError)
      }

      // Vérifier si la notification existe toujours
      const existingNotification = await this.prisma.notificationHistory.findUnique({
        where: { id: notification.id }
      })

      if (existingNotification) {
        // Marquer comme envoyée
        await this.prisma.notificationHistory.update({
          where: { id: notification.id },
          data: {
            status: 'sent',
            sentAt: now
          }
        })
      } else {
        NotificationLogger.logError('Mise à jour du statut', new Error('Notification non trouvée dans la base de données'))
      }
    } catch (error) {
      NotificationLogger.logError('Traitement de notification', error)

      // Vérifier si la notification existe toujours
      const existingNotification = await this.prisma.notificationHistory.findUnique({
        where: { id: notification.id }
      })

      if (existingNotification) {
        // Marquer comme échouée
        await this.prisma.notificationHistory.update({
          where: { id: notification.id },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }

      throw error
    }
  }

  private canSendNotification(settings: any, date: Date): boolean {
    if (!settings) return false

    // Utiliser la timezone utilisateur si disponible, sinon défaut Europe/Paris
    const timeZone = settings.timezone || process.env.DEFAULT_TIMEZONE || 'Europe/Paris'

    // Convertir la date fournie en heure de la timezone pour comparaison
    const parts = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      hour12: false,
      timeZone
    }).formatToParts(date)

    const hourPart = parts.find(p => p.type === 'hour')
    const hour = hourPart ? parseInt(hourPart.value, 10) : date.getHours()

    const start = Math.max(0, Math.min(23, Number(settings.startHour ?? 0)))
    let end = Number(settings.endHour ?? 24)
    if (end === 0) end = 24
    end = Math.max(1, Math.min(24, end))

    // Fenêtre [start, end) avec gestion du wrap minuit
    if (start < end) {
      return hour >= start && hour < end
    } else if (start > end) {
      return hour >= start || hour < end
    } else {
      // start == end : interprétation "24/24" si start==0==end
      return start === 0
    }
  }

  private extractBodyFromContent(content: string): string {
    if (!content) return ''
    let body = content.replace(/\n+/g, ' ').trim()
    if (body.length > 200) {
      body = body.substring(0, 197) + '...'
    }
    return body
  }

  async createNotification(userId: string, type: string, content: string, scheduledFor: Date) {
    try {
      const notification = await this.prisma.notificationHistory.create({
        data: {
          userId,
          type,
          content,
          scheduledFor,
          status: 'pending'
        }
      })

      NotificationLogger.logNotificationCreation(notification)
      return notification
    } catch (error) {
      NotificationLogger.logError('Création de notification', error)
      throw error
    }
  }

  async scheduleNotification(userId: string, type: string, content: string, scheduledFor: Date) {
    try {
      // Récupérer les préférences de l'utilisateur
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          notificationSettings: true
        }
      })

      if (!user) {
        throw new Error(`Utilisateur ${userId} non trouvé`)
      }

      NotificationLogger.logNotificationSettings(user.notificationSettings)

      // Vérifier si la notification peut être envoyée à cette heure
      if (!this.canSendNotification(user.notificationSettings, scheduledFor)) {
      return null
    }

      const notification = await this.prisma.notificationHistory.create({
        data: {
          userId,
          type,
          content,
          scheduledFor,
          status: 'pending'
        }
      })

      NotificationLogger.logNotificationCreation(notification)
      return notification
    } catch (error) {
      NotificationLogger.logError('Planification de notification', error)
      throw error
    }
  }

  async retryFailedNotifications() {
    try {
      // Récupérer les notifications échouées
      const failedNotifications = await this.prisma.notificationHistory.findMany({
        where: {
          status: 'failed',
          scheduledFor: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
          }
        }
      })

      for (const notification of failedNotifications) {
        try {
          // Réessayer d'envoyer la notification
          await this.processNotification(notification)
        } catch (error) {
          console.error(`Erreur lors de la nouvelle tentative pour la notification ${notification.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la reprise des notifications échouées:', error)
      throw error
    }
  }

  async scheduleDailyMotivation(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          notificationSettings: true
        }
      })

      if (!user || !user.notificationSettings?.motivation) {
        return
      }

      const motivationalMessages = [
        "Une nouvelle journée commence ! Quels objectifs allez-vous atteindre aujourd'hui ?",
        "Chaque petit pas compte. Concentrez-vous sur vos priorités !",
        "N'oubliez pas de célébrer vos victoires, même les plus petites !",
        "Vous avez le pouvoir de rendre cette journée productive et enrichissante.",
        "Rappelez-vous pourquoi vous avez commencé. Gardez le cap !"
      ]

      const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
      const scheduledTime = new Date()
      scheduledTime.setHours(parseInt(user.notificationSettings.morningTime.split(':')[0]))
      scheduledTime.setMinutes(parseInt(user.notificationSettings.morningTime.split(':')[1]))

      await this.prisma.notificationHistory.create({
        data: {
          userId: user.id,
          type: 'DAILY_MOTIVATION',
          content: message,
          scheduledFor: scheduledTime,
          status: 'pending'
        }
      })
    } catch (error) {
      console.error('Erreur lors de la planification de la motivation quotidienne:', error)
      throw error
    }
  }

  async scheduleMorningNotification(userId: string, date: Date) {
    try {
      const content = await NotificationContentBuilder.buildMorningContent(userId)
      await this.createNotification(userId, 'MORNING_REMINDER', content, date)
    } catch (error) {
      NotificationLogger.logError('Planification de la notification du matin', error)
    }
  }

  async scheduleNoonNotification(userId: string, date: Date) {
    try {
      const content = await NotificationContentBuilder.buildNoonContent(userId)
      await this.createNotification(userId, 'NOON_CHECK', content, date)
    } catch (error) {
      NotificationLogger.logError('Planification de la notification du midi', error)
    }
  }

  async scheduleAfternoonNotification(userId: string, date: Date) {
    try {
      const content = await NotificationContentBuilder.buildAfternoonContent(userId)
      await this.createNotification(userId, 'AFTERNOON_REMINDER', content, date)
    } catch (error) {
      NotificationLogger.logError('Planification de la notification de l\'après-midi', error)
    }
  }

  async scheduleEveningNotification(userId: string, date: Date) {
    try {
      const content = await NotificationContentBuilder.buildEveningContent(userId)
      await this.createNotification(userId, 'EVENING_PLANNING', content, date)
    } catch (error) {
      NotificationLogger.logError('Planification de la notification du soir', error)
    }
  }

  async scheduleNightNotification(userId: string, date: Date) {
    try {
      const content = await NotificationContentBuilder.buildNightContent(userId)
      await this.createNotification(userId, 'NIGHT_HABITS_CHECK', content, date)
    } catch (error) {
      NotificationLogger.logError('Planification de la notification de nuit', error)
    }
  }
}

export default new NotificationService() 
