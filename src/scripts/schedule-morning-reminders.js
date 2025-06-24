const { MongoClient } = require('mongodb');
const NotificationService = require('../services/notifications/notificationService');

async function scheduleMorningReminders() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        console.log('🌅 Planification des rappels matinaux...');

        await client.connect();
        console.log('✅ Connecté à MongoDB');

        const db = client.db('plannificateur');

        // Récupérer tous les utilisateurs avec des préférences de notification
        const users = await db.collection('User').aggregate([
            {
                $lookup: {
                    from: 'UserNotificationPreference',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'preferences'
                }
            },
            {
                $match: {
                    'preferences.morningReminder': true
                }
            }
        ]).toArray();

        console.log(`📝 ${users.length} utilisateurs trouvés avec des rappels matinaux activés`);

        // Pour chaque utilisateur, récupérer ses tâches du jour et planifier un rappel
        for (const user of users) {
            try {
                const tasks = await db.collection('Task').find({
                    userId: user._id,
                    dueDate: {
                        $gte: new Date(),
                        $lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                }).toArray();

                if (tasks.length > 0) {
                    await NotificationService.scheduleMorningTaskReminders(user._id, tasks);
                    console.log(`✅ Rappel planifié pour ${user.email} (${tasks.length} tâches)`);
                }
            } catch (error) {
                console.error(`❌ Erreur pour l'utilisateur ${user.email}:`, error);
            }
        }

        console.log('✨ Planification terminée !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

scheduleMorningReminders(); 