import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'

// Import de la fonction handler
let triggerScheduledCheckIn

async function loadBehaviorHandler() {
  try {
    const behaviorModule = await import('../agent/handlers/behavior.handler.js')
    triggerScheduledCheckIn = behaviorModule.triggerScheduledCheckIn
    console.log('✅ Behavior handler chargé')
  } catch (error) {
    console.error('⚠️ Impossible de charger behavior.handler', error.message)
  }
}

export class BehaviorCheckInScheduler {
  constructor() {
    this.prisma = new PrismaClient()
    this.cronJobs = new Map()
  }

  async start() {
    console.log('🔔 BehaviorCheckInScheduler démarrage...')

    // Charger le handler
    if (!triggerScheduledCheckIn) {
      await loadBehaviorHandler()
    }

    if (!triggerScheduledCheckIn) {
      console.log('⚠️ triggerScheduledCheckIn non disponible, scheduler désactivé')
      return
    }

    try {
      // Créer automatiquement des check-ins pour les utilisateurs qui n'en ont pas
      await this.ensureAllUsersHaveSchedules()

      // Charger toutes les configurations utilisateurs
      const schedules = await this.prisma.checkInSchedule.findMany({
        where: { enabled: true },
        include: {
          user: {
            include: {
              notificationSettings: true
            }
          }
        }
      })

      for (const schedule of schedules) {
        this.scheduleUserCheckIns(schedule)
      }

      console.log(`✅ BehaviorCheckInScheduler démarré pour ${schedules.length} utilisateurs`)
    } catch (error) {
      console.error('❌ Erreur démarrage BehaviorCheckInScheduler:', error.message)
    }
  }

  /**
   * S'assure que tous les utilisateurs avec WhatsApp activé ont un checkInSchedule
   */
  async ensureAllUsersHaveSchedules() {
    try {
      // Trouver tous les utilisateurs avec WhatsApp activé
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { whatsappNumber: { not: null } },
            { notificationSettings: { whatsappEnabled: true, whatsappNumber: { not: null } } }
          ]
        },
        include: {
          notificationSettings: true
        }
      })

      let created = 0

      for (const user of users) {
        const phoneNumber = user.whatsappNumber || user.notificationSettings?.whatsappNumber
        const whatsappEnabled = user.notificationSettings?.whatsappEnabled || !!user.whatsappNumber

        if (!phoneNumber || !whatsappEnabled) {
          continue
        }

        // Vérifier si un schedule existe déjà
        const existing = await this.prisma.checkInSchedule.findUnique({
          where: { userId: user.id }
        })

        if (!existing) {
          // Créer un schedule par défaut
          await this.prisma.checkInSchedule.create({
            data: {
              userId: user.id,
              enabled: true,
              frequency: '3x_daily',
              randomize: true,
              skipWeekends: false,
              schedules: [
                { time: '09:00', types: ['mood', 'energy'] },
                { time: '14:00', types: ['focus', 'motivation'] },
                { time: '18:00', types: ['stress', 'energy'] }
              ]
            }
          })
          created++
          console.log(`✨ CheckInSchedule créé pour ${user.email || user.id}`)
        }
      }

      if (created > 0) {
        console.log(`✅ ${created} nouveau(x) checkInSchedule(s) créé(s) automatiquement`)
      }
    } catch (error) {
      console.error('❌ Erreur ensureAllUsersHaveSchedules:', error.message)
    }
  }

  stop() {
    this.cronJobs.forEach(job => job.stop())
    this.cronJobs.clear()
    console.log('🔔 BehaviorCheckInScheduler arrêté')
  }

  scheduleUserCheckIns(schedule) {
    const userId = schedule.userId
    const phoneNumber = schedule.user?.notificationSettings?.whatsappNumber

    if (!phoneNumber || !schedule.user?.notificationSettings?.whatsappEnabled) {
      return
    }

    // Parser les horaires personnalisés
    const schedules = schedule.schedules || []

    schedules.forEach((sched, idx) => {
      if (!sched.time || !sched.types) {
        console.warn(`⚠️ Schedule invalide ignoré:`, sched)
        return
      }

      const [hour, minute] = sched.time.split(':').map(Number)

      // Ajuster avec randomization si activé
      let finalHour = hour
      let finalMinute = minute

      if (schedule.randomize) {
        const offset = Math.floor(Math.random() * 31) - 15 // -15 à +15 min
        finalMinute += offset

        if (finalMinute < 0) {
          finalMinute += 60
          finalHour -= 1
        } else if (finalMinute >= 60) {
          finalMinute -= 60
          finalHour += 1
        }
      }

      // Construire le cron pattern
      let cronPattern = `${finalMinute} ${finalHour} * * *`

      if (schedule.skipWeekends) {
        cronPattern = `${finalMinute} ${finalHour} * * 1-5` // Lundi-Vendredi
      }

      const jobKey = `${userId}-${idx}`

      const job = cron.schedule(cronPattern, async () => {
        try {
          if (triggerScheduledCheckIn) {
            await triggerScheduledCheckIn(userId, phoneNumber, sched.types)
          }
        } catch (error) {
          console.error(`❌ Erreur envoi check-in pour ${userId}:`, error.message)
        }
      }, {
        timezone: 'Europe/Paris',
        scheduled: false // Ne pas démarrer automatiquement
      })

      this.cronJobs.set(jobKey, job)
      job.start() // Démarrer manuellement
    })
  }

  async updateUserSchedule(userId) {
    // Supprimer les jobs existants pour cet utilisateur
    this.cronJobs.forEach((job, key) => {
      if (key.startsWith(userId)) {
        job.stop()
        this.cronJobs.delete(key)
      }
    })

    // Recharger et reprogrammer
    try {
      const schedule = await this.prisma.checkInSchedule.findUnique({
        where: { userId },
        include: {
          user: {
            include: {
              notificationSettings: true
            }
          }
        }
      })

      if (schedule?.enabled) {
        this.scheduleUserCheckIns(schedule)
      }
    } catch (error) {
      console.error(`❌ Erreur updateUserSchedule pour ${userId}:`, error.message)
    }
  }

  /**
   * Recharge tous les schedules depuis la base de données
   * Utile pour inclure les nouveaux utilisateurs sans redémarrer le scheduler
   */
  async reloadAllSchedules() {
    try {
      console.log('🔄 Rechargement de tous les schedules...')
      
      // Créer automatiquement des check-ins pour les utilisateurs qui n'en ont pas
      await this.ensureAllUsersHaveSchedules()

      // Arrêter tous les jobs existants
      this.cronJobs.forEach(job => job.stop())
      this.cronJobs.clear()

      // Recharger toutes les configurations utilisateurs
      const schedules = await this.prisma.checkInSchedule.findMany({
        where: { enabled: true },
        include: {
          user: {
            include: {
              notificationSettings: true
            }
          }
        }
      })

      // Reprogrammer tous les utilisateurs
      for (const schedule of schedules) {
        this.scheduleUserCheckIns(schedule)
      }

      console.log(`✅ ${schedules.length} schedule(s) rechargé(s)`)
    } catch (error) {
      console.error('❌ Erreur reloadAllSchedules:', error.message)
    }
  }
}

export const behaviorCheckInScheduler = new BehaviorCheckInScheduler()
