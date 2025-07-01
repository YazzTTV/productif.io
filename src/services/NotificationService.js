import { PrismaClient } from '@prisma/client';
import WhatsAppService from './whatsappService.js';
import NotificationLogger from './NotificationLogger.js';
import NotificationContentBuilder from './NotificationContentBuilder.js';
import { getNotificationTitle } from './notification-titles.js';

class NotificationService {
    constructor() {
        this.prisma = new PrismaClient();
        this.whatsappService = WhatsAppService;
    }
    async processNotifications() {
        try {
            const now = new Date();
            // Arrondir à la minute
            now.setSeconds(0, 0);
            const oneMinuteFromNow = new Date(now);
            oneMinuteFromNow.setMinutes(now.getMinutes() + 1);
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
            });
            console.log(`🔄 Traitement de ${notifications.length} notifications...`);
            for (const notification of notifications) {
                try {
                    await this.processNotification(notification);
                }
                catch (error) {
                    NotificationLogger.logError(`Traitement de la notification ${notification.id}`, error);
                }
            }
        }
        catch (error) {
            NotificationLogger.logError('Traitement des notifications', error);
        }
    }
    async processNotification(notification) {
        NotificationLogger.logNotificationProcessing(notification);
        try {
            const now = new Date();
            // Vérifier si l'utilisateur accepte les notifications à cette heure
            if (!this.canSendNotification(notification.user.notificationSettings, now)) {
                console.log(`⏳ Notification reportée :`);
                console.log(`  - Raison: Hors plage horaire`);
                console.log(`  - Heure actuelle: ${now.getHours()}h${now.getMinutes()}`);
                console.log(`  - Plage autorisée: ${notification.user.notificationSettings.startHour}h-${notification.user.notificationSettings.endHour}h`);
                return;
            }
            // Vérifier les canaux de notification disponibles
            const settings = notification.user.notificationSettings;
            if (!settings?.whatsappEnabled || !notification.user.whatsappNumber) {
                NotificationLogger.logError('Configuration WhatsApp', new Error('WhatsApp non configuré pour l\'utilisateur'));
                return;
            }
            // Tentative d'envoi WhatsApp
            await this.whatsappService.sendMessage(notification.user.whatsappNumber, this.formatWhatsAppMessage(notification));
            // Vérifier si la notification existe toujours
            const existingNotification = await this.prisma.notificationHistory.findUnique({
                where: { id: notification.id }
            });
            if (existingNotification) {
                // Marquer comme envoyée
                await this.prisma.notificationHistory.update({
                    where: { id: notification.id },
                    data: {
                        status: 'sent',
                        sentAt: now
                    }
                });
                console.log(`✅ Notification envoyée avec succès`);
                console.log(`  - Heure d'envoi: ${now.toLocaleTimeString()}`);
            }
            else {
                NotificationLogger.logError('Mise à jour du statut', new Error('Notification non trouvée dans la base de données'));
            }
        }
        catch (error) {
            NotificationLogger.logError('Traitement de notification', error);
            // Vérifier si la notification existe toujours
            const existingNotification = await this.prisma.notificationHistory.findUnique({
                where: { id: notification.id }
            });
            if (existingNotification) {
                // Marquer comme échouée
                await this.prisma.notificationHistory.update({
                    where: { id: notification.id },
                    data: {
                        status: 'failed',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
            throw error;
        }
    }
    canSendNotification(settings, date) {
        if (!settings)
            return false;
        const hour = date.getHours();
        return hour >= settings.startHour && hour <= settings.endHour;
    }
    formatWhatsAppMessage(notification) {
        const title = getNotificationTitle(notification.type);
        let message = `${title}\n\n`;
        message += notification.content;
        message += '\n\n_Envoyé via Productif.io_';
        return message;
    }
    async createNotification(userId, type, content, scheduledFor) {
        try {
            const notification = await this.prisma.notificationHistory.create({
                data: {
                    userId,
                    type,
                    content,
                    scheduledFor,
                    status: 'pending'
                }
            });
            NotificationLogger.logNotificationCreation(notification);
            return notification;
        }
        catch (error) {
            NotificationLogger.logError('Création de notification', error);
            throw error;
        }
    }
    async scheduleNotification(userId, type, content, scheduledFor) {
        try {
            // Récupérer les préférences de l'utilisateur
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    notificationSettings: true
                }
            });
            if (!user) {
                throw new Error(`Utilisateur ${userId} non trouvé`);
            }
            NotificationLogger.logNotificationSettings(user.notificationSettings);
            // Vérifier si la notification peut être envoyée à cette heure
            if (!this.canSendNotification(user.notificationSettings, scheduledFor)) {
                console.log(`⚠️ La notification ne peut pas être envoyée à cette heure`);
                return null;
            }
            const notification = await this.prisma.notificationHistory.create({
                data: {
                    userId,
                    type,
                    content,
                    scheduledFor,
                    status: 'pending'
                }
            });
            NotificationLogger.logNotificationCreation(notification);
            return notification;
        }
        catch (error) {
            NotificationLogger.logError('Planification de notification', error);
            throw error;
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
            });
            for (const notification of failedNotifications) {
                try {
                    // Réessayer d'envoyer la notification
                    await this.processNotification(notification);
                }
                catch (error) {
                    console.error(`Erreur lors de la nouvelle tentative pour la notification ${notification.id}:`, error);
                }
            }
        }
        catch (error) {
            console.error('Erreur lors de la reprise des notifications échouées:', error);
            throw error;
        }
    }
    async scheduleDailyMotivation(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    notificationSettings: true
                }
            });
            if (!user || !user.notificationSettings?.motivation) {
                return;
            }
            const motivationalMessages = [
                "Une nouvelle journée commence ! Quels objectifs allez-vous atteindre aujourd'hui ?",
                "Chaque petit pas compte. Concentrez-vous sur vos priorités !",
                "N'oubliez pas de célébrer vos victoires, même les plus petites !",
                "Vous avez le pouvoir de rendre cette journée productive et enrichissante.",
                "Rappelez-vous pourquoi vous avez commencé. Gardez le cap !"
            ];
            const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
            const scheduledTime = new Date();
            scheduledTime.setHours(parseInt(user.notificationSettings.morningTime.split(':')[0]));
            scheduledTime.setMinutes(parseInt(user.notificationSettings.morningTime.split(':')[1]));
            await this.prisma.notificationHistory.create({
                data: {
                    userId: user.id,
                    type: 'DAILY_MOTIVATION',
                    content: message,
                    scheduledFor: scheduledTime,
                    status: 'pending'
                }
            });
        }
        catch (error) {
            console.error('Erreur lors de la planification de la motivation quotidienne:', error);
            throw error;
        }
    }
    async scheduleMorningNotification(userId, date) {
        try {
            const content = await NotificationContentBuilder.buildMorningContent(userId);
            await this.createNotification(userId, 'MORNING_REMINDER', content, date);
        }
        catch (error) {
            NotificationLogger.logError('Planification de la notification du matin', error);
        }
    }
    async scheduleNoonNotification(userId, date) {
        try {
            const content = await NotificationContentBuilder.buildNoonContent(userId);
            await this.createNotification(userId, 'NOON_CHECK', content, date);
        }
        catch (error) {
            NotificationLogger.logError('Planification de la notification du midi', error);
        }
    }
    async scheduleAfternoonNotification(userId, date) {
        try {
            const content = await NotificationContentBuilder.buildAfternoonContent(userId);
            await this.createNotification(userId, 'AFTERNOON_REMINDER', content, date);
        }
        catch (error) {
            NotificationLogger.logError('Planification de la notification de l\'après-midi', error);
        }
    }
    async scheduleEveningNotification(userId, date) {
        try {
            const content = await NotificationContentBuilder.buildEveningContent(userId);
            await this.createNotification(userId, 'EVENING_PLANNING', content, date);
        }
        catch (error) {
            NotificationLogger.logError('Planification de la notification du soir', error);
        }
    }
    async scheduleNightNotification(userId, date) {
        try {
            const content = await NotificationContentBuilder.buildNightContent(userId);
            await this.createNotification(userId, 'NIGHT_HABITS_CHECK', content, date);
        }
        catch (error) {
            NotificationLogger.logError('Planification de la notification de nuit', error);
        }
    }
}
export default new NotificationService();
