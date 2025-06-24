const { MongoClient } = require('mongodb');
const whatsappService = require('../services/whatsappService');
const NotificationScheduler = require('../services/NotificationScheduler');

async function testNotificationSystem() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        console.log('🚀 Test du système de notifications v2...');

        await client.connect();
        console.log('✅ Connecté à MongoDB');

        const db = client.db('plannificateur');

        // 1. Récupérer les préférences de notification existantes
        console.log('🔍 Recherche des préférences de notification...');
        const userPreferences = await db.collection('UserNotificationPreference').findOne({
            whatsappEnabled: true,
            whatsappNumber: { $ne: null }
        });

        if (!userPreferences) {
            throw new Error('Aucune préférence de notification WhatsApp trouvée. Veuillez d\'abord configurer un numéro WhatsApp.');
        }

        console.log('✅ Préférences trouvées pour l\'utilisateur:', userPreferences.userId);
        console.log('📱 Numéro WhatsApp:', userPreferences.whatsappNumber);

        // 2. Initialiser le planificateur avec le service WhatsApp existant
        console.log('\n⚙️ Création du planificateur...');
        const scheduler = new NotificationScheduler(whatsappService);

        // 3. Créer une notification de test
        const testMessage = {
            type: 'TEST',
            content: '🔔 Ceci est une notification de test v2 de production',
            scheduledFor: new Date(Date.now() + 60000), // Dans 1 minute
            status: 'pending'
        };

        console.log('\n📝 Création d\'une notification de test...');
        const notification = await db.collection('NotificationHistory').insertOne({
            userId: userPreferences.userId,
            type: testMessage.type,
            content: testMessage.content,
            scheduledFor: testMessage.scheduledFor,
            status: testMessage.status
        });

        console.log('✅ Notification créée:', notification.insertedId);
        console.log('⏰ Planifiée pour:', testMessage.scheduledFor);

        // 4. Démarrer le planificateur
        console.log('\n⚡ Démarrage du planificateur...');
        scheduler.start();

        // 5. Attendre 2 minutes
        console.log('⏳ Attente de 2 minutes...');
        await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));

        // 6. Vérifier le statut
        const updatedNotification = await db.collection('NotificationHistory').findOne({
            _id: notification.insertedId
        });

        console.log('\n📊 Résultat:');
        console.log('- Status:', updatedNotification.status);
        console.log('- Envoyée le:', updatedNotification.sentAt);
        if (updatedNotification.status === 'failed') {
            console.log('- Erreur:', updatedNotification.error);
        }

        // 7. Arrêter le planificateur
        scheduler.stop();
        console.log('\n✅ Test terminé !');
        
        // 8. Nettoyage
        try {
            await db.collection('NotificationHistory').deleteOne({
                _id: notification.insertedId
            });
        } catch (error) {
            console.log('Note: Impossible de supprimer la notification de test');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await client.close();
    }
}

testNotificationSystem(); 