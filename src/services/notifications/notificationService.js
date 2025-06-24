const { MongoClient } = require('mongodb');

class NotificationService {
  constructor() {
    this.mongoClient = new MongoClient(process.env.MONGODB_URI);
  }

  /**
   * Planifie le rappel matinal des tâches
   */
  async scheduleMorningTaskReminders(userId, tasks) {
    // Créer la notification pour demain matin à 7h
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);

    const taskList = tasks.map(task => `- ${task.title}`).join('\n');
    const content = `🌅 Bonjour ! Voici vos tâches pour aujourd'hui :\n${taskList}`;

    await this.scheduleNotification(
      userId,
      'MORNING_TASKS',
      content,
      tomorrow
    );
  }

  /**
   * Vérifie si une notification peut être envoyée selon les préférences de l'utilisateur
   */
  async canSendNotification(userId, type, scheduledFor) {
    try {
      await this.mongoClient.connect();
      const db = this.mongoClient.db('plannificateur');
      const preferences = await db.collection('UserNotificationPreference').findOne({ userId });

      // Si pas de préférences ou notifications désactivées
      if (!preferences || !preferences.isEnabled) {
        return false;
      }

      // Pour les rappels matinaux, on ignore les heures configurées
      if (type === 'MORNING_TASKS') {
        const dayOfWeek = scheduledFor.getDay();
        const allowedDays = preferences.allowedDays || [];
        return allowedDays.includes(dayOfWeek);
      }

      // Pour les autres notifications, on garde la logique existante
      const hour = scheduledFor.getHours();
      if (hour < preferences.startHour || hour > preferences.endHour) {
        return false;
      }

      const dayOfWeek = scheduledFor.getDay();
      const allowedDays = preferences.allowedDays || [];
      if (!allowedDays.includes(dayOfWeek)) {
        return false;
      }

      const notificationTypes = preferences.notificationTypes || [];
      if (!notificationTypes.includes(type)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification des préférences:', error);
      return false;
    } finally {
      await this.mongoClient.close();
    }
  }

  /**
   * Planifie une notification pour un utilisateur
   */
  async scheduleNotification(userId, type, content, scheduledFor) {
    try {
      // Vérifier si la notification peut être envoyée
      const canSend = await this.canSendNotification(userId, type, scheduledFor);
      
      if (!canSend) {
        console.log(`Notification non planifiée pour l'utilisateur ${userId} (préférences non satisfaites)`);
        return null;
      }

      await this.mongoClient.connect();
      const db = this.mongoClient.db('plannificateur');

      // Créer l'entrée dans l'historique
      const notification = await db.collection('NotificationHistory').insertOne({
        userId,
        type,
        content,
        scheduledFor,
        status: 'pending'
      });

      console.log(`Notification planifiée: ${notification.insertedId}`);
      return notification;
    } catch (error) {
      console.error('Erreur lors de la planification de la notification:', error);
      throw error;
    } finally {
      await this.mongoClient.close();
    }
  }

  /**
   * Récupère les notifications en attente pour une période donnée
   */
  async getPendingNotifications(startTime, endTime) {
    try {
      await this.mongoClient.connect();
      const db = this.mongoClient.db('plannificateur');
      return await db.collection('NotificationHistory').aggregate([
        {
          $match: {
            status: 'pending',
            scheduledFor: {
              $gte: startTime,
              $lte: endTime
            }
          }
        },
        {
          $lookup: {
            from: 'User',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        }
      ]).toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    } finally {
      await this.mongoClient.close();
    }
  }

  /**
   * Marque une notification comme envoyée
   */
  async markAsSent(notificationId) {
    try {
      await this.mongoClient.connect();
      const db = this.mongoClient.db('plannificateur');
      return await db.collection('NotificationHistory').updateOne(
        { _id: notificationId },
        {
          $set: {
            status: 'sent',
            sentAt: new Date()
          }
        }
      );
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      throw error;
    } finally {
      await this.mongoClient.close();
    }
  }

  /**
   * Marque une notification comme échouée
   */
  async markAsFailed(notificationId, error) {
    try {
      await this.mongoClient.connect();
      const db = this.mongoClient.db('plannificateur');
      return await db.collection('NotificationHistory').updateOne(
        { _id: notificationId },
        {
          $set: {
            status: 'failed',
            error: error.message || 'Unknown error'
          }
        }
      );
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      throw error;
    } finally {
      await this.mongoClient.close();
    }
  }

  /**
   * Met à jour les préférences de notification d'un utilisateur
   */
  async updateUserPreferences(userId, preferences) {
    try {
      await this.mongoClient.connect();
      const db = this.mongoClient.db('plannificateur');
      return await db.collection('UserNotificationPreference').updateOne(
        { userId },
        {
          $set: preferences
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      throw error;
    } finally {
      await this.mongoClient.close();
    }
  }

  /**
   * Récupère les préférences de notification d'un utilisateur
   */
  async getUserPreferences(userId) {
    try {
      await this.mongoClient.connect();
      const db = this.mongoClient.db('plannificateur');
      return await db.collection('UserNotificationPreference').findOne({ userId });
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences:', error);
      throw error;
    } finally {
      await this.mongoClient.close();
    }
  }
}

module.exports = new NotificationService(); 