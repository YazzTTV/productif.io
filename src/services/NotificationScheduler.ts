import { ScheduledTask } from 'node-cron'
import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import NotificationService from './NotificationService.ts'
import NotificationLogger from './NotificationLogger.ts'
import EventManager, { NotificationPreferencesUpdateEvent } from '../../lib/EventManager.js'

class NotificationScheduler {
  private jobs: Map<string, ScheduledTask>
  private prisma: PrismaClient
  private notificationService: typeof NotificationService
  private eventManager: EventManager
  private isStarted: boolean = false

  constructor(prisma?: PrismaClient) {
    this.jobs = new Map()
    this.prisma = prisma || new PrismaClient()
    this.notificationService = NotificationService
    this.eventManager = EventManager.getInstance()
    
    // S'abonner aux événements de mise à jour des préférences
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Écouter les mises à jour de préférences
    this.eventManager.onPreferencesUpdate(this.handlePreferencesUpdate.bind(this))
    
    // Écouter les suppressions d'utilisateurs
    this.eventManager.onUserDeleted(this.handleUserDeleted.bind(this))
    
    // Écouter les redémarrages du planificateur
    this.eventManager.onSchedulerRestart(this.handleSchedulerRestart.bind(this))
    
    console.log('🎧 EventListeners configurés pour le planificateur')
  }

  /**
   * Gestionnaire des mises à jour de préférences
   */
  private async handlePreferencesUpdate(event: NotificationPreferencesUpdateEvent) {
    console.log(`🔄 Mise à jour des préférences pour l'utilisateur ${event.userId}`)
    
    try {
      const { userId, oldPreferences, newPreferences } = event
      
      // Arrêter les anciennes tâches de cet utilisateur
      await this.stopUserTasks(userId)
      
      // Vérifier si les notifications sont activées
      if (!newPreferences.isEnabled) {
        console.log(`❌ Notifications désactivées pour ${userId} - aucune tâche planifiée`)
        return
      }
      
      // Planifier les nouvelles tâches
      await this.scheduleUserNotifications(userId, newPreferences)
      
      console.log(`✅ Préférences mises à jour avec succès pour ${userId}`)
    } catch (error) {
      NotificationLogger.logError(`Mise à jour des préférences pour ${event.userId}`, error)
    }
  }

  /**
   * Gestionnaire de suppression d'utilisateur
   */
  private async handleUserDeleted(data: { userId: string }) {
    console.log(`🗑️ Suppression des tâches pour l'utilisateur ${data.userId}`)
    await this.stopUserTasks(data.userId)
  }

  /**
   * Gestionnaire de redémarrage du planificateur
   */
  private async handleSchedulerRestart() {
    console.log('🔄 Redémarrage du planificateur demandé')
    await this.stop()
    await this.start()
  }

  /**
   * Arrête toutes les tâches d'un utilisateur spécifique
   */
  private async stopUserTasks(userId: string) {
    console.log(`🛑 Arrêt des tâches pour l'utilisateur ${userId}`)
    
    const userJobs = Array.from(this.jobs.keys()).filter(jobId => jobId.startsWith(`${userId}-`))
    
    for (const jobId of userJobs) {
      const job = this.jobs.get(jobId)
      if (job) {
        job.stop()
        this.jobs.delete(jobId)
        console.log(`   ✅ Tâche arrêtée: ${jobId}`)
      }
    }
    
    console.log(`🛑 ${userJobs.length} tâches arrêtées pour l'utilisateur ${userId}`)
  }

  /**
   * Compare les préférences pour détecter les changements significatifs
   */
  private hasSignificantChanges(oldPrefs: any, newPrefs: any): boolean {
    if (!oldPrefs || !newPrefs) return true
    
    const significantFields = [
      'isEnabled', 'morningReminder', 'taskReminder', 'habitReminder',
      'motivation', 'dailySummary', 'morningTime', 'noonTime', 
      'afternoonTime', 'eveningTime', 'nightTime', 'allowedDays'
    ]
    
    return significantFields.some(field => 
      JSON.stringify(oldPrefs[field]) !== JSON.stringify(newPrefs[field])
    )
  }

  async start() {
    if (this.isStarted) {
      console.log('⚠️ Le planificateur est déjà démarré')
      return
    }

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

      this.isStarted = true
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
      if (settings.taskReminder) {
        this.scheduleDailyNotification(
          userId,
          noonTime,
          async (date) => await this.notificationService.scheduleNoonNotification(userId, date)
        )
      }

      // Notification de l'après-midi
      if (settings.habitReminder) {
        this.scheduleDailyNotification(
          userId,
          afternoonTime,
          async (date) => await this.notificationService.scheduleAfternoonNotification(userId, date)
        )
      }

      // Notification du soir
      if (settings.motivation) {
        this.scheduleDailyNotification(
          userId,
          eveningTime,
          async (date) => await this.notificationService.scheduleEveningNotification(userId, date)
        )
      }

      // Notification de nuit
      if (settings.dailySummary) {
        this.scheduleDailyNotification(
          userId,
          nightTime,
          async (date) => await this.notificationService.scheduleNightNotification(userId, date)
        )
      }

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
    // Éviter de créer plusieurs tâches de nettoyage
    if (this.jobs.has('cleanup')) {
      return
    }

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
    this.isStarted = false
    console.log('✅ Planificateur arrêté\n')
  }

  /**
   * Méthode publique pour forcer la mise à jour d'un utilisateur
   */
  async updateUserSchedule(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { notificationSettings: true }
      })

      if (!user || !user.notificationSettings) {
        console.log(`⚠️ Utilisateur ${userId} non trouvé ou sans préférences`)
        return
      }

      // Arrêter les anciennes tâches
      await this.stopUserTasks(userId)

      // Redémarrer avec les nouvelles préférences
      if (user.notificationSettings.isEnabled) {
        await this.scheduleUserNotifications(userId, user.notificationSettings)
      }

      console.log(`✅ Planification mise à jour pour l'utilisateur ${userId}`)
    } catch (error) {
      NotificationLogger.logError(`Mise à jour manuelle pour ${userId}`, error)
    }
  }

  /**
   * Obtenir le statut du planificateur
   */
  getStatus() {
    return {
      isStarted: this.isStarted,
      activeJobs: this.jobs.size,
      jobIds: Array.from(this.jobs.keys())
    }
  }
}

export default NotificationScheduler 
