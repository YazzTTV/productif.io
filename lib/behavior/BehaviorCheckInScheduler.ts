import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { triggerScheduledCheckIn } from '@/lib/agent/handlers/behavior.handler'

export class BehaviorCheckInScheduler {
  private cronJobs: Map<string, cron.ScheduledTask> = new Map()

  async start() {
    console.log('BehaviorCheckInScheduler démarrage...')

    // Charger toutes les configurations utilisateurs
    const schedules = await prisma.checkInSchedule.findMany({
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

    console.log(`BehaviorCheckInScheduler démarré pour ${schedules.length} utilisateurs`)
  }

  stop() {
    this.cronJobs.forEach(job => job.stop())
    this.cronJobs.clear()
    console.log('BehaviorCheckInScheduler arrêté')
  }

  private scheduleUserCheckIns(schedule: any) {
    const userId = schedule.userId
    const phoneNumber = schedule.user.notificationSettings?.whatsappNumber

    if (!phoneNumber || !schedule.user.notificationSettings?.whatsappEnabled) {
      return
    }

    // Parser les horaires personnalisés
    const schedules = schedule.schedules as Array<{ time: string; types: string[] }>

    schedules.forEach((sched, idx) => {
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
          await triggerScheduledCheckIn(userId, phoneNumber, sched.types)
        } catch (error) {
          console.error(`Erreur envoi check-in pour ${userId}:`, error)
        }
      }, {
        timezone: 'Europe/Paris'
      })

      this.cronJobs.set(jobKey, job)
    })
  }

  async updateUserSchedule(userId: string) {
    // Supprimer les jobs existants pour cet utilisateur
    this.cronJobs.forEach((job, key) => {
      if (key.startsWith(userId)) {
        job.stop()
        this.cronJobs.delete(key)
      }
    })

    // Recharger et reprogrammer
    const schedule = await prisma.checkInSchedule.findUnique({
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
  }
}

export const behaviorCheckInScheduler = new BehaviorCheckInScheduler()
