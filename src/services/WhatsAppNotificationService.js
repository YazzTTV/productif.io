const NotificationService = require('./NotificationService');
const { MongoClient } = require('mongodb');

class WhatsAppNotificationService {
    constructor(whatsappClient) {
        this.whatsappClient = whatsappClient;
        this.notificationService = NotificationService;
        this.client = new MongoClient(process.env.MONGODB_URI);
        this.db = null;

        // Connexion à MongoDB
        this.client.connect()
            .then(() => {
                console.log('Successfully connected to the database');
                this.db = this.client.db('plannificateur');
            })
            .catch((error) => {
                console.error('Failed to connect to the database:', error);
                process.exit(1);
            });
    }

    async sendMessage(phoneNumber, message) {
        try {
            await this.whatsappClient.sendMessage(phoneNumber, message);
            return true;
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            return false;
        }
    }

    async processNotifications() {
        try {
            if (!this.db) {
                console.log('Database connection not ready');
                return;
            }

            // Récupérer toutes les notifications en attente
            const pendingNotifications = await this.db.collection('NotificationHistory')
                .find({
                    status: 'pending',
                    scheduledFor: { $lte: new Date() }
                }).toArray();

            console.log(`Processing ${pendingNotifications.length} pending notifications...`);

            for (const notification of pendingNotifications) {
                // Récupérer les préférences de l'utilisateur
                const preferences = await this.db.collection('UserNotificationPreference')
                    .findOne({ userId: notification.userId });

                // Vérifier si les notifications WhatsApp sont activées et si le numéro est configuré
                if (!preferences?.whatsappEnabled || !preferences?.whatsappNumber) {
                    console.log(`Skipping notification ${notification._id} - WhatsApp not enabled or no number configured`);
                    continue;
                }

                console.log(`Sending WhatsApp notification to ${preferences.whatsappNumber}`);

                // Envoyer la notification via WhatsApp
                const success = await this.sendMessage(preferences.whatsappNumber, notification.content);

                if (success) {
                    await this.db.collection('NotificationHistory').updateOne(
                        { _id: notification._id },
                        {
                            $set: {
                                status: 'sent',
                                sentAt: new Date()
                            }
                        }
                    );
                    console.log(`Successfully sent notification ${notification._id}`);
                } else {
                    await this.db.collection('NotificationHistory').updateOne(
                        { _id: notification._id },
                        {
                            $set: {
                                status: 'failed',
                                error: 'Failed to send WhatsApp message'
                            }
                        }
                    );
                    console.log(`Failed to send notification ${notification._id}`);
                }
            }
        } catch (error) {
            console.error('Error processing WhatsApp notifications:', error);
            throw error;
        }
    }

    async retryFailedNotifications(maxRetries = 3) {
        try {
            if (!this.db) {
                console.log('Database connection not ready');
                return;
            }

            const failedNotifications = await this.db.collection('NotificationHistory')
                .find({
                    status: 'failed',
                    error: { $ne: null }
                }).toArray();

            console.log(`Retrying ${failedNotifications.length} failed notifications...`);

            for (const notification of failedNotifications) {
                // Récupérer les préférences de l'utilisateur
                const preferences = await this.db.collection('UserNotificationPreference')
                    .findOne({ userId: notification.userId });

                if (!preferences?.whatsappEnabled || !preferences?.whatsappNumber) {
                    console.log(`Skipping notification ${notification._id} - WhatsApp not enabled or no number configured`);
                    continue;
                }

                console.log(`Retrying WhatsApp notification to ${preferences.whatsappNumber}`);

                const success = await this.sendMessage(preferences.whatsappNumber, notification.content);

                if (success) {
                    await this.db.collection('NotificationHistory').updateOne(
                        { _id: notification._id },
                        {
                            $set: {
                                status: 'sent',
                                sentAt: new Date(),
                                error: null
                            }
                        }
                    );
                    console.log(`Successfully retried notification ${notification._id}`);
                } else {
                    await this.db.collection('NotificationHistory').updateOne(
                        { _id: notification._id },
                        {
                            $set: {
                                error: 'Failed to retry WhatsApp message'
                            }
                        }
                    );
                    console.log(`Failed to retry notification ${notification._id}`);
                }
            }
        } catch (error) {
            console.error('Error retrying failed notifications:', error);
            throw error;
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
        }
    }
}

module.exports = WhatsAppNotificationService; 