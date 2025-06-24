const { MongoClient } = require('mongodb');

async function setupNotificationPreferences() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        console.log('🚀 Configuration des préférences de notification...');

        await client.connect();
        console.log('✅ Connecté à MongoDB');

        const db = client.db('plannificateur');

        // Créer ou mettre à jour les préférences
        const preferences = await db.collection('UserNotificationPreference').updateOne(
            { userId: 'test-user' },
            {
                $set: {
                    isEnabled: true,
                    whatsappEnabled: true,
                    whatsappNumber: '+33783642205',
                    startHour: 9,
                    endHour: 22,
                    allowedDays: [1, 2, 3, 4, 5, 6, 7],
                    notificationTypes: ['TASK_DUE', 'HABIT_REMINDER', 'DAILY_SUMMARY']
                }
            },
            { upsert: true }
        );

        console.log('✅ Préférences configurées:', preferences);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

setupNotificationPreferences(); 