const { MongoClient } = require('mongodb');

class NotificationService {
    constructor() {
        this.mongoClient = new MongoClient(process.env.MONGODB_URI);
    }

    async getScheduledNotifications(status = 'pending') {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db('plannificateur');
            return await db.collection('ScheduledNotification').aggregate([
                {
                    $match: { status }
                },
                {
                    $lookup: {
                        from: 'NotificationSettings',
                        localField: 'settingsId',
                        foreignField: '_id',
                        as: 'settings'
                    }
                },
                {
                    $unwind: '$settings'
                }
            ]).toArray();
        } catch (error) {
            console.error('Error getting scheduled notifications:', error);
            throw error;
        } finally {
            await this.mongoClient.close();
        }
    }

    async markNotificationAsSent(id) {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db('plannificateur');
            return await db.collection('ScheduledNotification').updateOne(
                { _id: id },
                {
                    $set: {
                        status: 'sent',
                        sentAt: new Date()
                    }
                }
            );
        } catch (error) {
            console.error('Error marking notification as sent:', error);
            throw error;
        } finally {
            await this.mongoClient.close();
        }
    }

    async markNotificationAsFailed(id) {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db('plannificateur');
            const notification = await db.collection('ScheduledNotification').findOne({ _id: id });

            return await db.collection('ScheduledNotification').updateOne(
                { _id: id },
                {
                    $set: {
                        status: 'failed',
                        retryCount: (notification.retryCount || 0) + 1,
                        lastAttempt: new Date()
                    }
                }
            );
        } catch (error) {
            console.error('Error marking notification as failed:', error);
            throw error;
        } finally {
            await this.mongoClient.close();
        }
    }

    async scheduleNotification(userId, message, scheduledFor, type = 'reminder') {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db('plannificateur');
            
            // Récupérer les paramètres de notification de l'utilisateur
            const settings = await db.collection('NotificationSettings').findOne({ userId });

            if (!settings) {
                throw new Error('Notification settings not found for user');
            }

            return await db.collection('ScheduledNotification').insertOne({
                settingsId: settings._id,
                message,
                scheduledFor,
                type,
                status: 'pending'
            });
        } catch (error) {
            console.error('Error scheduling notification:', error);
            throw error;
        } finally {
            await this.mongoClient.close();
        }
    }

    async cancelNotification(id) {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db('plannificateur');
            return await db.collection('ScheduledNotification').updateOne(
                { _id: id },
                {
                    $set: {
                        status: 'cancelled'
                    }
                }
            );
        } catch (error) {
            console.error('Error cancelling notification:', error);
            throw error;
        } finally {
            await this.mongoClient.close();
        }
    }

    async getUserNotifications(userId, status = null) {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db('plannificateur');
            
            const settings = await db.collection('NotificationSettings').findOne({ userId });

            if (!settings) {
                return [];
            }

            const query = {
                settingsId: settings._id
            };

            if (status) {
                query.status = status;
            }

            return await db.collection('ScheduledNotification').find(query)
                .sort({ scheduledFor: 1 })
                .toArray();
        } catch (error) {
            console.error('Error getting user notifications:', error);
            throw error;
        } finally {
            await this.mongoClient.close();
        }
    }

    async getUserNotificationSettings(userId) {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db('plannificateur');
            return await db.collection('NotificationSettings').findOne({ userId });
        } catch (error) {
            console.error('Error getting user notification settings:', error);
            throw error;
        } finally {
            await this.mongoClient.close();
        }
    }

    async updateUserNotificationSettings(userId, settings) {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db('plannificateur');
            return await db.collection('NotificationSettings').updateOne(
                { userId },
                {
                    $set: settings
                },
                { upsert: true }
            );
        } catch (error) {
            console.error('Error updating user notification settings:', error);
            throw error;
        } finally {
            await this.mongoClient.close();
        }
    }

    async scheduleTaskReminder(userId, taskId, taskTitle, dueDate) {
        const settings = await this.getUserNotificationSettings(userId);
        if (!settings || (!settings.emailEnabled && !settings.whatsappEnabled)) {
            return null;
        }

        const message = `Rappel: La tâche "${taskTitle}" est à faire pour le ${dueDate.toLocaleDateString('fr-FR')}`;
        
        // Schedule for 1 day before the due date at the user's preferred time
        const scheduledFor = new Date(dueDate);
        scheduledFor.setDate(scheduledFor.getDate() - 1);
        const [hours, minutes] = settings.reminderTime.split(':');
        scheduledFor.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        return await this.scheduleNotification(
            userId,
            message,
            scheduledFor,
            'task_reminder'
        );
    }

    async scheduleHabitReminder(userId, habitId, habitName, targetDate) {
        const settings = await this.getUserNotificationSettings(userId);
        if (!settings || (!settings.emailEnabled && !settings.whatsappEnabled)) {
            return null;
        }

        const message = `N'oubliez pas votre habitude "${habitName}" aujourd'hui !`;
        
        // Schedule for the target date at the user's preferred time
        const scheduledFor = new Date(targetDate);
        const [hours, minutes] = settings.reminderTime.split(':');
        scheduledFor.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        return await this.scheduleNotification(
            userId,
            message,
            scheduledFor,
            'habit_reminder'
        );
    }

    async scheduleDailyMotivation(userId) {
        const settings = await this.getUserNotificationSettings(userId);
        if (!settings || !settings.dailyMotivation || (!settings.emailEnabled && !settings.whatsappEnabled)) {
            return null;
        }

        const motivationalMessages = [
            "Une nouvelle journée commence ! Faites-en une journée productive et épanouissante.",
            "Chaque petit pas compte. Concentrez-vous sur vos objectifs d'aujourd'hui.",
            "N'oubliez pas de célébrer vos victoires, même les plus petites !",
            "La productivité commence par une bonne organisation. Planifiez votre journée !",
            "Vous avez le pouvoir de faire de cette journée une réussite."
        ];

        const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        
        // Schedule for tomorrow at the user's preferred time
        const scheduledFor = new Date();
        scheduledFor.setDate(scheduledFor.getDate() + 1);
        const [hours, minutes] = settings.reminderTime.split(':');
        scheduledFor.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        return await this.scheduleNotification(
            userId,
            message,
            scheduledFor,
            'daily_motivation'
        );
    }
}

// Exporter une instance singleton
module.exports = new NotificationService(); 