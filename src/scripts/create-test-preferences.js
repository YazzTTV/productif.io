const { MongoClient } = require('mongodb');

async function createTestPreferences() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        console.log('🚀 Création des préférences de test...');

        await client.connect();
        console.log('✅ Connecté à MongoDB');

        const db = client.db('plannificateur');
        
        // Créer les préférences de notification
        const preferences = await db.collection('UserNotificationPreference').insertOne({
            _id: 'test-preferences',
            userId: 'test-user',
            whatsappEnabled: true,
            whatsappNumber: '+33783642205',
            morningReminder: true,
            taskReminder: true,
            habitReminder: true,
            motivation: true,
            dailySummary: true
        });

        console.log('✅ Préférences créées:', preferences);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

createTestPreferences(); 