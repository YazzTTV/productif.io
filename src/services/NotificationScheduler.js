import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import NotificationService from './NotificationService.js';
import NotificationLogger from './NotificationLogger.js';
class NotificationScheduler {
    constructor(whatsappService, prisma) {
        this.jobs = new Map();
        this.prisma = prisma || new PrismaClient();
        this.notificationService = NotificationService;
        this.whatsappService = whatsappService;
    }
    async start() {
        console.log('\n🚀 Démarrage du planificateur de notifications...');
        try {
            // Récupérer tous les utilisateurs avec leurs préférences
            const users = await this.prisma.user.findMany({
                include: {
                    notificationSettings: true
                }
            });
            console.log(`📊 Utilisateurs trouvés : ${users.length}`);
            for (const user of users) {
                if (!user.notificationSettings) {
                    console.log(`⚠️ Pas de préférences pour ${user.email}`);
                    continue;
                }
                const settings = user.notificationSettings;
                NotificationLogger.logNotificationSettings(settings);
                if (!settings.isEnabled) {
                    console.log(`❌ Notifications désactivées pour ${user.email}`);
                    continue;
                }
                // Planifier les notifications pour chaque utilisateur
                await this.scheduleUserNotifications(user.id, settings);
            }
            
            // Planifier le traitement des notifications
            this.scheduleNotificationProcessing();
            
            // Planifier le nettoyage des anciennes notifications
            this.scheduleCleanup();
            console.log('✅ Planificateur démarré avec succès\n');
        }
        catch (error) {
            NotificationLogger.logError('Démarrage du planificateur', error);
            throw error;
        }
    }
    async scheduleUserNotifications(userId, settings) {
        try {
            const { morningTime, noonTime, afternoonTime, eveningTime, nightTime } = settings;
            // Notification du matin
            if (settings.morningReminder) {
                this.scheduleDailyNotification(userId, morningTime, async (date) => await this.notificationService.scheduleMorningNotification(userId, date));
            }
            // Notification du midi
            this.scheduleDailyNotification(userId, noonTime, async (date) => await this.notificationService.scheduleNoonNotification(userId, date));
            // Notification de l'après-midi
            this.scheduleDailyNotification(userId, afternoonTime, async (date) => await this.notificationService.scheduleAfternoonNotification(userId, date));
            // Notification du soir
            this.scheduleDailyNotification(userId, eveningTime, async (date) => await this.notificationService.scheduleEveningNotification(userId, date));
            // Notification de nuit
            this.scheduleDailyNotification(userId, nightTime, async (date) => await this.notificationService.scheduleNightNotification(userId, date));
            console.log(`✅ Notifications planifiées pour l'utilisateur ${userId}`);
        }
        catch (error) {
            NotificationLogger.logError(`Planification des notifications pour l'utilisateur ${userId}`, error);
        }
    }
    scheduleDailyNotification(userId, time, callback) {
        const [hours, minutes] = time.split(':').map(Number);
        const cronExpression = `${minutes} ${hours} * * *`;
        if (!cron.validate(cronExpression)) {
            NotificationLogger.logError('Validation de l\'expression cron', new Error(`Expression cron invalide : ${cronExpression}`));
            return;
        }
        const job = cron.schedule(cronExpression, async () => {
            try {
                const now = new Date();
                await callback(now);
            }
            catch (error) {
                NotificationLogger.logError('Exécution de la tâche planifiée', error);
            }
        });
        const jobId = `${userId}-${time}`;
        this.jobs.set(jobId, job);
        console.log(`📅 Tâche planifiée : ${jobId}`);
        console.log(`   Expression cron : ${cronExpression}`);
    }
    scheduleNotificationProcessing() {
        // Vérifier et traiter les notifications toutes les minutes
        const job = cron.schedule('* * * * *', async () => {
            try {
                await this.processNotifications();
            }
            catch (error) {
                NotificationLogger.logError('Traitement des notifications', error);
            }
        });
        this.jobs.set('processNotifications', job);
        console.log('🔄 Tâche de traitement des notifications planifiée (toutes les minutes)');
    }

    async processNotifications() {
        try {
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            const twoMinutesInFuture = new Date(now.getTime() + 2 * 60 * 1000);

            // Récupérer les notifications en attente qui doivent être envoyées
            const pendingNotifications = await this.prisma.notificationHistory.findMany({
                where: {
                    status: 'pending',
                    scheduledFor: {
                        gte: fiveMinutesAgo,
                        lte: twoMinutesInFuture
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

            if (pendingNotifications.length > 0) {
                console.log(`🔄 Traitement de ${pendingNotifications.length} notifications...`);
                
                for (const notification of pendingNotifications) {
                    try {
                        await this.notificationService.processNotification(notification);
                    }
                    catch (error) {
                        NotificationLogger.logError(`Traitement de la notification ${notification.id}`, error);
                    }
                }
            }
        }
        catch (error) {
            NotificationLogger.logError('Processus de vérification des notifications', error);
        }
    }

    scheduleCleanup() {
        // Nettoyer les notifications plus vieilles que 7 jours à minuit
        const job = cron.schedule('0 0 * * *', async () => {
            try {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const result = await this.prisma.notificationHistory.deleteMany({
                    where: {
                        scheduledFor: {
                            lt: sevenDaysAgo
                        }
                    }
                });
                console.log(`🧹 Nettoyage des notifications :`);
                console.log(`   ${result.count} notifications supprimées`);
            }
            catch (error) {
                NotificationLogger.logError('Nettoyage des notifications', error);
            }
        });
        this.jobs.set('cleanup', job);
        console.log('🧹 Tâche de nettoyage planifiée');
    }
    stop() {
        console.log('\n🛑 Arrêt du planificateur...');
        this.jobs.forEach((job, id) => {
            job.stop();
            console.log(`   Tâche arrêtée : ${id}`);
        });
        this.jobs.clear();
        console.log('✅ Planificateur arrêté\n');
    }
}
export default NotificationScheduler;
