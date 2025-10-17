import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { whatsappService } from '@/lib/whatsapp'

export class MorningInsightsScheduler {
  private cronJob: cron.ScheduledTask | null = null

  start() {
    // Vérifie chaque minute, envoie aux utilisateurs à leur heure configurée (Europe/Paris)
    this.cronJob = cron.schedule(
      '*/1 * * * *',
      async () => {
        await this.sendMorningInsights()
      },
      { timezone: 'Europe/Paris' }
    )
    console.log('MorningInsightsScheduler démarré (vérification chaque minute)')
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop()
      console.log('MorningInsightsScheduler arrêté')
    }
  }

  private async sendMorningInsights() {
    try {
      const now = new Date()
      // Heure courante HH:mm en Europe/Paris
      const nowParts = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Paris' })
      const [nowH, nowM] = nowParts.split(':')
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Récupérer tous les utilisateurs avec WhatsApp activé
      const users = await prisma.user.findMany({
        where: {
          notificationSettings: {
            isEnabled: true,
            whatsappEnabled: true,
            whatsappNumber: { not: null }
          }
        },
        include: { notificationSettings: true }
      })

      for (const user of users) {
        try {
          const settings = user.notificationSettings
          const target = (settings?.morningTime || '07:00').split(':')
          const [th, tm] = [target[0] || '07', target[1] || '00']
          // N'envoie qu'à l'heure exacte HH:mm (Europe/Paris)
          if (nowH !== th || nowM !== tm) {
            continue
          }
          // Vérifier si l'utilisateur a des journaux récents
          const recentJournals = await prisma.journalEntry.count({
            where: {
              userId: user.id,
              processed: true,
              date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          })
          if (recentJournals === 0) continue

          // Insight du jour
          const insight = await this.getOrCreateInsight(user.id, today)
          if (!insight.sent && user.notificationSettings?.whatsappNumber) {
            await this.sendInsightToUser(user.notificationSettings.whatsappNumber, insight)
            await prisma.dailyInsight.update({
              where: { id: insight.id },
              data: { sent: true, sentAt: new Date() }
            })
          }
        } catch (e) {
          console.error(`Erreur envoi insight pour user ${user.id}:`, e)
        }
      }
    } catch (error) {
      console.error('Erreur sendMorningInsights:', error)
    }
  }

  private async getOrCreateInsight(userId: string, date: Date) {
    let insight = await prisma.dailyInsight.findUnique({
      where: { userId_date: { userId, date } }
    })
    if (!insight) {
      const { generateDailyInsights } = await import('@/lib/ai/daily-insights')
      const { recommendations, focusAreas } = await generateDailyInsights(userId, 7)

      const recentJournals = await prisma.journalEntry.findMany({
        where: {
          userId,
          processed: true,
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        select: { id: true }
      })

      insight = await prisma.dailyInsight.create({
        data: {
          userId,
          date,
          recommendations,
          focusAreas,
          basedOnDays: 7,
          journalEntries: recentJournals.map((j) => j.id)
        }
      })
    }
    return insight
  }

  private async sendInsightToUser(phoneNumber: string, insight: any) {
    let message = `🌅 **Bonjour ! Voici tes insights du jour**\n\n`
    if (Array.isArray(insight.focusAreas) && insight.focusAreas.length > 0) {
      message += `🎯 **Aujourd'hui, concentre-toi sur :**\n`
      for (const area of insight.focusAreas) message += `• ${area}\n`
      message += `\n`
    }
    message += `💡 **Mes recommandations :**\n`
    insight.recommendations.forEach((rec: string, idx: number) => {
      message += `${idx + 1}. ${rec}\n`
    })
    message += `\n✨ Bonne journée productive ! 💪`

    await whatsappService.sendMessage(phoneNumber, message)
  }
}

export const morningInsightsScheduler = new MorningInsightsScheduler()


