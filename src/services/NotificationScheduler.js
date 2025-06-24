const cron = require('node-cron');
const NotificationService = require('./NotificationService');
const WhatsAppNotificationService = require('./WhatsAppNotificationService');
const { MongoClient } = require('mongodb');

class NotificationScheduler {
    constructor(whatsappClient) {
        this.notificationService = NotificationService;
        this.whatsappNotificationService = new WhatsAppNotificationService(whatsappClient);
        this.jobs = new Map();
        this.mongoClient = new MongoClient(process.env.MONGODB_URI);
    }

    start() {
        // Traiter les notifications toutes les minutes
        this.jobs.set('processNotifications', cron.schedule('* * * * *', async () => {
            try {
                await this.whatsappNotificationService.processNotifications();
            } catch (error) {
                console.error('Error in notification processing job:', error);
            }
        }));

        // Réessayer les notifications échouées toutes les 15 minutes
        this.jobs.set('retryFailedNotifications', cron.schedule('*/15 * * * *', async () => {
            try {
                await this.whatsappNotificationService.retryFailedNotifications();
            } catch (error) {
                console.error('Error in failed notifications retry job:', error);
            }
        }));

        // Planifier les notifications de motivation quotidienne à minuit
        this.jobs.set('scheduleDailyMotivation', cron.schedule('0 0 * * *', async () => {
            try {
                await this.mongoClient.connect();
                const db = this.mongoClient.db('plannificateur');

                // Récupérer tous les utilisateurs avec les notifications quotidiennes activées
                const users = await db.collection('User').find({
                    'notificationSettings.dailyMotivation': true
                }).toArray();

                // Planifier les notifications pour chaque utilisateur
                for (const user of users) {
                    await this.notificationService.scheduleDailyMotivation(user._id);
                }
            } catch (error) {
                console.error('Error scheduling daily motivation:', error);
            } finally {
                await this.mongoClient.close();
            }
        }));

        // Nettoyer les anciennes notifications tous les jours à 1h du matin
        this.jobs.set('cleanupOldNotifications', cron.schedule('0 1 * * *', async () => {
            try {
                await this.mongoClient.connect();
                const db = this.mongoClient.db('plannificateur');
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                await db.collection('ScheduledNotification').deleteMany({
                    $or: [
                        {
                            status: 'sent',
                            scheduledFor: {
                                $lt: thirtyDaysAgo
                            }
                        },
                        {
                            status: 'failed',
                            retryCount: {
                                $gte: 3
                            },
                            scheduledFor: {
                                $lt: thirtyDaysAgo
                            }
                        }
                    ]
                });
            } catch (error) {
                console.error('Error cleaning up old notifications:', error);
            } finally {
                await this.mongoClient.close();
            }
        }));

        console.log('🔔 Planificateur de notifications démarré');
    }

    stop() {
        for (const [name, job] of this.jobs) {
            console.log(`Arrêt du job ${name}...`);
            job.stop();
        }
        this.jobs.clear();
        console.log('🔕 Planificateur de notifications arrêté');
    }
}

module.exports = NotificationScheduler; 