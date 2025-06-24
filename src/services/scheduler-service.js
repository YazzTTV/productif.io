const whatsappService = require('./whatsappService');
const NotificationScheduler = require('./NotificationScheduler');
const express = require('express');

const app = express();

// Variable globale pour le planificateur
let scheduler = null;

async function startSchedulerService() {
    try {
        console.log('🚀 Démarrage du service de planification...');

        // 1. Configurer le serveur Express pour le healthcheck
        app.use(express.json());

        // Route de santé pour Railway
        app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'scheduler',
                schedulerActive: scheduler !== null 
            });
        });

        // 2. Démarrer le planificateur
        console.log('⚙️ Initialisation du planificateur...');
        scheduler = new NotificationScheduler(whatsappService);
        scheduler.start();
        console.log('✅ Planificateur démarré');

        // 3. Démarrer le serveur pour le healthcheck
        const port = process.env.PORT || 3001; // Port différent de l'agent WhatsApp
        app.listen(port, () => {
            console.log(`🌐 Serveur de monitoring démarré sur le port ${port}`);
        });

        // 4. Gérer l'arrêt gracieux
        process.on('SIGTERM', async () => {
            console.log('\n📴 Signal d\'arrêt reçu...');
            await stopSchedulerService();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            console.log('\n📴 Signal d\'interruption reçu...');
            await stopSchedulerService();
            process.exit(0);
        });

        console.log('✨ Service de planification démarré et fonctionnel !');
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du service:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

async function stopSchedulerService() {
    try {
        if (scheduler) {
            console.log('⏹️ Arrêt du planificateur...');
            scheduler.stop();
            scheduler = null;
        }
        console.log('✅ Service arrêté avec succès');
    } catch (error) {
        console.error('❌ Erreur lors de l\'arrêt du service:', error);
    }
}

// Démarrer le service
startSchedulerService(); 