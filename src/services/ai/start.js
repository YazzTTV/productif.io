const { MongoClient } = require('mongodb');
const WhatsAppService = require('../whatsappService');

async function startAIService() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        console.log('🚀 Démarrage du service IA...');

        // Connexion à MongoDB
        await client.connect();
        console.log('✅ Connecté à MongoDB');

        // Initialiser le service WhatsApp
        const whatsappService = new WhatsAppService();
        console.log('✅ Service WhatsApp initialisé');

        // Gérer l'arrêt gracieux
        process.on('SIGTERM', async () => {
            console.log('\n📴 Signal d\'arrêt reçu...');
            await client.close();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            console.log('\n📴 Signal d\'interruption reçu...');
            await client.close();
            process.exit(0);
        });

        console.log('✨ Service IA démarré avec succès !');
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du service:', error);
        process.exit(1);
    }
}

startAIService(); 