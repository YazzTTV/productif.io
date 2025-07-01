import { ScheduledTask } from 'node-cron'
import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import NotificationService from './NotificationService'
import WhatsAppService from './WhatsAppService'
import NotificationLogger from './NotificationLogger'

class NotificationScheduler {
  private jobs: Map<string, ScheduledTask>
  private prisma: PrismaClient
  private notificationService: typeof NotificationService
  private whatsappService: typeof WhatsAppService

  constructor(whatsappService: typeof WhatsAppService, prisma?: PrismaClient) {
    this.jobs = new Map()
    this.prisma = prisma || new PrismaClient()
    this.notificationService = NotificationService
    this.whatsappService = whatsappService
  }

  async start() {
    console.log('\n🚀 Démarrage du planificateur de notifications...')

    try {
      // Récupérer tous les utilisateurs avec leurs préférences
      const users = await this.prisma.user.findMany({
        include: {
          notificationSettings: true
        }
      })

      console.log(`📊 Utilisateurs trouvés : ${users.length}`)

      for (const user of users) {
        if (!user.notificationSettings) {
          console.log(`⚠️ Pas de préférences pour ${user.email}`)
          continue
        }

        const settings = user.notificationSettings
        NotificationLogger.logNotificationSettings(settings)

        if (!settings.isEnabled) {
          console.log(`❌ Notifications désactivées pour ${user.email}`)
          continue
        }

        // Planifier les notifications pour chaque utilisateur
        await this.scheduleUserNotifications(user.id, settings)
      }

      // Planifier le nettoyage des anciennes notifications
      this.scheduleCleanup()

      console.log('✅ Planificateur démarré avec succès\n')
    } catch (error) {
      NotificationLogger.logError('Démarrage du planificateur', error)
      throw error
    }
  }

  private async scheduleUserNotifications(userId: string, settings: any) {
    try {
      const { morningTime, noonTime, afternoonTime, eveningTime, nightTime } = settings

      // Notification du matin
      if (settings.morningReminder) {
        this.scheduleDailyNotification(
          userId,
          morningTime,
          async (date) => await this.notificationService.scheduleMorningNotification(userId, date)
        )
      }

      // Notification du midi
      this.scheduleDailyNotification(
        userId,
        noonTime,
        async (date) => await this.notificationService.scheduleNoonNotification(userId, date)
      )

      // Notification de l'après-midi
      this.scheduleDailyNotification(
        userId,
        afternoonTime,
        async (date) => await this.notificationService.scheduleAfternoonNotification(userId, date)
      )

      // Notification du soir
      this.scheduleDailyNotification(
        userId,
        eveningTime,
        async (date) => await this.notificationService.scheduleEveningNotification(userId, date)
      )

      // Notification de nuit
      this.scheduleDailyNotification(
        userId,
        nightTime,
        async (date) => await this.notificationService.scheduleNightNotification(userId, date)
      )

      console.log(`✅ Notifications planifiées pour l'utilisateur ${userId}`)
    } catch (error) {
      NotificationLogger.logError(`Planification des notifications pour l'utilisateur ${userId}`, error)
    }
  }

  private scheduleDailyNotification(
    userId: string,
    time: string,
    callback: (date: Date) => Promise<void>
  ) {
    const [hours, minutes] = time.split(':').map(Number)
    const cronExpression = `${minutes} ${hours} * * *`

    if (!cron.validate(cronExpression)) {
      NotificationLogger.logError(
        'Validation de l\'expression cron',
        new Error(`Expression cron invalide : ${cronExpression}`)
      )
      return
    }

    const job = cron.schedule(cronExpression, async () => {
      try {
        const now = new Date()
        await callback(now)
      } catch (error) {
        NotificationLogger.logError('Exécution de la tâche planifiée', error)
      }
    })

    const jobId = `${userId}-${time}`
    this.jobs.set(jobId, job)

    console.log(`📅 Tâche planifiée : ${jobId}`)
    console.log(`   Expression cron : ${cronExpression}`)
  }

  private scheduleCleanup() {
    // Nettoyer les notifications plus vieilles que 7 jours à minuit
    const job = cron.schedule('0 0 * * *', async () => {
      try {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const result = await this.prisma.notificationHistory.deleteMany({
          where: {
            scheduledFor: {
              lt: sevenDaysAgo
            }
          }
        })

        console.log(`🧹 Nettoyage des notifications :`)
        console.log(`   ${result.count} notifications supprimées`)
      } catch (error) {
        NotificationLogger.logError('Nettoyage des notifications', error)
      }
    })

    this.jobs.set('cleanup', job)
    console.log('🧹 Tâche de nettoyage planifiée')
  }

  stop() {
    console.log('\n🛑 Arrêt du planificateur...')
    this.jobs.forEach((job, id) => {
      job.stop()
      console.log(`   Tâche arrêtée : ${id}`)
    })
    this.jobs.clear()
    console.log('✅ Planificateur arrêté\n')
  }
}

export default NotificationScheduler 