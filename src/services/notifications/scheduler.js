const notificationService = require('./notificationService');
const whatsappService = require('../whatsappService');

class NotificationScheduler {
    constructor() {
        this.interval = null;
    }

    /**
     * Démarre le planificateur de notifications
     */
    start() {
        if (this.interval) {
            console.log('Le planificateur est déjà en cours d\'exécution');
            return;
        }

        console.log('Démarrage du planificateur de notifications');
        
        // Vérifier les notifications toutes les minutes
        this.interval = setInterval(async () => {
            await this.checkAndSendNotifications();
        }, 60 * 1000); // 60 secondes
    }

    /**
     * Arrête le planificateur de notifications
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('Planificateur de notifications arrêté');
        }
    }

    /**
     * Vérifie et envoie les notifications en attente
     */
    async checkAndSendNotifications() {
        try {
            const now = new Date();
            const startTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes dans le passé
            const endTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes dans le futur

            // Récupérer les notifications en attente
            const pendingNotifications = await notificationService.getPendingNotifications(
                startTime,
                endTime
            );

            console.log(`${pendingNotifications.length} notifications en attente trouvées`);

            // Traiter chaque notification
            for (const notification of pendingNotifications) {
                try {
                    // Envoyer via WhatsApp
                    await whatsappService.sendNotification(notification);
                } catch (error) {
                    console.error(`Erreur lors de l'envoi de la notification ${notification.id}:`, error);
                    await notificationService.markAsFailed(notification.id, error);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des notifications:', error);
        }
    }
}

module.exports = new NotificationScheduler(); 