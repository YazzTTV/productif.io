import { prisma } from '@/lib/prisma'
import { whatsappService } from '@/lib/whatsapp'

export class DeepWorkScheduler {
  private checkInterval: NodeJS.Timeout | null = null
  private readonly CHECK_FREQUENCY_MS = 2 * 60 * 1000

  start() {
    if (this.checkInterval) {
      console.warn('DeepWorkScheduler déjà démarré')
      return
    }
    this.checkInterval = setInterval(() => {
      this.checkSessions().catch((error) => {
        console.error('Erreur dans checkSessions:', error)
      })
    }, this.CHECK_FREQUENCY_MS)

    console.log('✅ DeepWorkScheduler démarré (vérification toutes les 2min)')
    this.checkSessions().catch(console.error)
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('⏹️ DeepWorkScheduler arrêté')
    }
  }

  private async checkSessions() {
    try {
      const now = new Date()
      const activeSessions = await prisma.deepWorkSession.findMany({
        where: { status: 'active' },
        include: {
          user: { select: { id: true, whatsappNumber: true, notificationSettings: true } },
          timeEntry: true
        }
      })

      console.log(`🔍 Vérification de ${activeSessions.length} session(s) active(s)`) 

      for (const session of activeSessions) {
        const elapsed = Math.floor((now.getTime() - session.timeEntry.startTime.getTime()) / 60000)
        const remainingMinutes = session.plannedDuration - elapsed

        if (remainingMinutes <= 0) {
          console.log(`⏰ Session ${session.id} terminée (${elapsed}min écoulées)`) 
          await this.completeSession(session)
        } else if (remainingMinutes === 5) {
          await this.sendReminder(session, remainingMinutes)
        }
      }
    } catch (error) {
      console.error('❌ Erreur vérification sessions Deep Work:', error)
    }
  }

  private async completeSession(session: any) {
    try {
      const now = new Date()
      const duration = Math.floor((now.getTime() - session.timeEntry.startTime.getTime()) / 60000)

      await prisma.deepWorkSession.update({ where: { id: session.id }, data: { status: 'completed' } })
      await prisma.timeEntry.update({ where: { id: session.timeEntry.id }, data: { endTime: now } })

      console.log(`✅ Session ${session.id} terminée automatiquement (${duration}min)`) 
      await this.sendCompletionNotification(session, duration)
    } catch (error) {
      console.error(`❌ Erreur completion session ${session.id}:`, error)
    }
  }

  private async sendCompletionNotification(session: any, actualDuration: number) {
    try {
      const prefs = session.user.notificationSettings
      const phone = session.user.whatsappNumber || prefs?.whatsappNumber
      if (!prefs?.whatsappEnabled || !phone) return

      const onTime = actualDuration <= session.plannedDuration + 2
      let message = `✅ *Session Deep Work terminée !*\n\n`
      message += `⏱️ Durée prévue : ${session.plannedDuration} minutes\n`
      message += `⏱️ Durée réelle : ${actualDuration} minutes\n\n`
      message += onTime ? `🎉 Parfait ! Tu as respecté ton temps prévu !\n\n` : `⚠️ Tu as dépassé de ${actualDuration - session.plannedDuration} minutes\n\n`
      message += `💪 Excellent travail de concentration ! Continue comme ça !`

      await whatsappService.sendMessage(phone, message)
      console.log(`📱 Notification envoyée à ${session.user.id}`)
    } catch (error) {
      console.error('❌ Erreur envoi notification completion:', error)
    }
  }

  private async sendReminder(session: any, minutesLeft: number) {
    try {
      const prefs = session.user.notificationSettings
      const phone = session.user.whatsappNumber || prefs?.whatsappNumber
      if (!prefs?.whatsappEnabled || !phone) return

      const message = `⏰ *Rappel Deep Work*\n\nPlus que ${minutesLeft} minutes sur ta session !\n\n🎯 Termine en beauté ! 💪`
      await whatsappService.sendMessage(phone, message)
      console.log(`📱 Rappel 5min envoyé à ${session.user.id}`)
    } catch (error) {
      console.error('❌ Erreur envoi rappel:', error)
    }
  }
}

export const deepWorkScheduler = new DeepWorkScheduler()


