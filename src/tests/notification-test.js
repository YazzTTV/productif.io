const { MongoClient } = require('mongodb');
const whatsappService = require('../services/whatsappService');
const NotificationScheduler = require('../services/NotificationScheduler');

async function testNotificationSystem() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        console.log('🚀 Test du système de notifications...');

        await client.connect();
        console.log('✅ Connecté à MongoDB');

        const db = client.db('plannificateur');

        // 1. Créer une notification de test
        console.log('📝 Création d\'une notification de test...');
        const notification = await db.collection('NotificationHistory').insertOne({
            userId: 'test-user',
            type: 'TEST',
            content: '🔔 Ceci est un message de test pour vérifier vos notifications',
            scheduledFor: new Date(),
            status: 'pending'
        });

        console.log('✅ Notification créée:', notification.insertedId);

        // 2. Initialiser le planificateur
        console.log('⚙️ Initialisation du planificateur...');
        const scheduler = new NotificationScheduler(whatsappService);
        scheduler.start();

        // 3. Attendre 1 minute
        console.log('⏳ Attente d\'une minute...');
        await new Promise(resolve => setTimeout(resolve, 60000));

        // 4. Vérifier le statut
        const updatedNotification = await db.collection('NotificationHistory').findOne({
            _id: notification.insertedId
        });

        console.log('\n📊 Résultat:');
        console.log('- Status:', updatedNotification.status);
        console.log('- Envoyée le:', updatedNotification.sentAt);
        if (updatedNotification.status === 'failed') {
            console.log('- Erreur:', updatedNotification.error);
        }

        // 5. Arrêter le planificateur
        scheduler.stop();
        console.log('\n✅ Test terminé !');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

testNotificationSystem(); 