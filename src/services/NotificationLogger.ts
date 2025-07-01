import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

class NotificationLogger {
    static logNotificationCreation(notification: any) {
        console.log('\n📝 CRÉATION DE NOTIFICATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`ID: ${notification.id}`);
        console.log(`Type: ${notification.type}`);
        console.log(`Utilisateur: ${notification.userId}`);
        console.log(`Planifiée pour: ${format(notification.scheduledFor, 'PPPp', { locale: fr })}`);
        console.log(`Status: ${notification.status}`);
        console.log('Content:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(notification.content);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    static logNotificationProcessing(notification: any) {
        console.log('\n🔄 TRAITEMENT DE NOTIFICATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`ID: ${notification.id}`);
        console.log(`Type: ${notification.type}`);
        console.log(`Utilisateur: ${notification.user.email}`);
        console.log(`Planifiée pour: ${format(notification.scheduledFor, 'PPPp', { locale: fr })}`);
        console.log(`Status actuel: ${notification.status}`);
        if (notification.error) {
            console.log(`Erreur précédente: ${notification.error}`);
        }
        console.log('Content:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(notification.content);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    static logNotificationSettings(settings: any) {
        console.log('\n⚙️ PARAMÈTRES DE NOTIFICATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Notifications activées: ${settings.isEnabled ? '✅' : '❌'}`);
        console.log(`WhatsApp: ${settings.whatsappEnabled ? '✅' : '❌'}`);
        console.log(`Numéro WhatsApp: ${settings.whatsappNumber || '❌'}`);
        console.log(`Plage horaire: ${settings.startHour}h-${settings.endHour}h`);
        console.log('\nHoraires des notifications:');
        console.log(`Matin: ${settings.morningTime}`);
        console.log(`Midi: ${settings.noonTime}`);
        console.log(`Après-midi: ${settings.afternoonTime}`);
        console.log(`Soir: ${settings.eveningTime}`);
        console.log(`Nuit: ${settings.nightTime}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    static logWhatsAppSending(phoneNumber: string, message: string) {
        console.log('\n📱 ENVOI WHATSAPP');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Numéro: ${phoneNumber}`);
        console.log('Message:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(message);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    static logWhatsAppResponse(status: number, response: any) {
        console.log('\n📬 RÉPONSE WHATSAPP');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Status: ${status}`);
        console.log('Réponse:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(typeof response === 'string' ? response : JSON.stringify(response, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    static logError(context: string, error: any) {
        console.error('\n❌ ERREUR');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`Contexte: ${context}`);
        console.error(`Message: ${error.message}`);
        if (error.stack) {
            console.error('Stack trace:');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error(error.stack);
        }
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    static logSchedulerStatus(jobs: Map<string, any>) {
        console.log('\n🔔 ÉTAT DU PLANIFICATEUR');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Jobs actifs: ${jobs.size}`);
        jobs.forEach((job, name) => {
            console.log(`- ${name}: ${job.running ? '✅' : '❌'}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
}

export default NotificationLogger; 