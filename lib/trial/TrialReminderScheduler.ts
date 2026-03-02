import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { TrialService } from './TrialService';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export class TrialReminderScheduler {
  private cronJob: ScheduledTask | null = null;

  start() {
    // Vérifier tous les jours à 10h00
    this.cronJob = cron.schedule('0 10 * * *', async () => {
      await this.checkAndSendReminders();
    }, {
      timezone: 'Europe/Paris'
    });

    console.log('✅ TrialReminderScheduler démarré (vérification quotidienne à 10h)');
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('⏹️ TrialReminderScheduler arrêté');
    }
  }

  private async checkAndSendReminders() {
    try {
      // Rappel 3 jours avant expiration
      await this.sendReminderForDay(3, 'reminder_3days');

      // Rappel 1 jour avant expiration
      await this.sendReminderForDay(1, 'reminder_1day');

      // Notification d'expiration (jour J)
      await this.sendExpirationNotifications();
    } catch (error) {
      console.error('❌ Erreur envoi rappels trial:', error);
    }
  }

  private async sendReminderForDay(daysLeft: number, type: string) {
    const users = await TrialService.getUsersWithExpiringTrial(daysLeft);

    console.log(`📧 ${users.length} utilisateur(s) à notifier (${daysLeft} jours restants)`);

    for (const user of users) {
      try {
        // Vérifier si déjà notifié
        const alreadySent = await TrialService.hasNotificationBeenSent(user.id, type);
        if (alreadySent) continue;

        // WhatsApp
        if (user.notificationSettings?.whatsappEnabled && user.notificationSettings?.whatsappNumber) {
          await this.sendReminderWhatsApp(user, daysLeft);
          await TrialService.recordNotificationSent(user.id, type, 'whatsapp');
        }

        console.log(`✅ Rappel ${daysLeft}j envoyé à ${user.email}`);
      } catch (error) {
        console.error(`❌ Erreur envoi rappel à ${user.id}:`, error);
      }
    }
  }

  private async sendExpirationNotifications() {
    const users = await TrialService.getUsersWithExpiringTrial(0);

    console.log(`🚨 ${users.length} trial(s) expire(nt) aujourd'hui`);

    for (const user of users) {
      try {
        const alreadySent = await TrialService.hasNotificationBeenSent(user.id, 'expired');
        if (alreadySent) continue;

        // WhatsApp
        if (user.notificationSettings?.whatsappEnabled && user.notificationSettings?.whatsappNumber) {
          await this.sendExpirationWhatsApp(user);
          await TrialService.recordNotificationSent(user.id, 'expired', 'whatsapp');
        }

        // Marquer le trial comme expiré
        await TrialService.expireTrial(user.id);
      } catch (error) {
        console.error(`❌ Erreur notification expiration pour ${user.id}:`, error);
      }
    }
  }

  private async sendReminderWhatsApp(user: any, daysLeft: number) {
    const message = `⏰ *Rappel Productif.io*\n\nTon essai gratuit expire dans *${daysLeft} jour${daysLeft > 1 ? 's' : ''}* !\n\n💡 Pour continuer sans interruption, choisis ton abonnement :\n${process.env.NEXT_PUBLIC_APP_URL}/upgrade\n\n✨ Tu vas adorer la version complète !`;

    await sendWhatsAppMessage(user.notificationSettings.whatsappNumber, message);
  }

  private async sendExpirationWhatsApp(user: any) {
    const message = `🚨 *Ton essai est terminé*\n\nTa période d'essai gratuite de 7 jours est maintenant terminée.\n\n🎉 *Offre spéciale :* -20% sur ton premier mois avec le code *WELCOME20*\n\n👉 Choisis ton abonnement ici :\n${process.env.NEXT_PUBLIC_APP_URL}/upgrade\n\nMerci de nous avoir fait confiance ! 💙`;

    await sendWhatsAppMessage(user.notificationSettings.whatsappNumber, message);
  }
}

export const trialReminderScheduler = new TrialReminderScheduler();
