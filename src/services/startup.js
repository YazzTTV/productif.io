const { MongoClient } = require('mongodb');
const NotificationScheduler = require('./NotificationScheduler');
const express = require('express');

class StartupService {
    constructor() {
        this.client = new MongoClient(process.env.MONGODB_URI);
        this.app = express();
        this.scheduler = null;
    }

    async start() {
        try {
            console.log('🚀 Démarrage des services...');

            // 1. Connexion à MongoDB
            await this.client.connect();
            console.log('✅ Connecté à MongoDB');

            // 2. Configurer Express
            this.app.use(express.json());

            // Route de santé
            this.app.get('/health', (req, res) => {
                res.json({
                    status: 'healthy',
                    services: {
                        mongodb: this.client.topology?.isConnected() || false,
                        scheduler: this.scheduler !== null
                    }
                });
            });

            // 3. Démarrer le planificateur
            console.log('⚙️ Initialisation du planificateur...');
            this.scheduler = new NotificationScheduler();
            this.scheduler.start();
            console.log('✅ Planificateur démarré');

            // 4. Démarrer le serveur
            const port = process.env.PORT || 3000;
            this.app.listen(port, () => {
                console.log(`🌐 Serveur démarré sur le port ${port}`);
            });

            // 5. Gérer l'arrêt gracieux
            process.on('SIGTERM', async () => {
                console.log('\n📴 Signal d\'arrêt reçu...');
                await this.stop();
                process.exit(0);
            });

            process.on('SIGINT', async () => {
                console.log('\n📴 Signal d\'interruption reçu...');
                await this.stop();
                process.exit(0);
            });

            console.log('✨ Services démarrés avec succès !');
        } catch (error) {
            console.error('❌ Erreur lors du démarrage des services:', error);
            process.exit(1);
        }
    }

    async stop() {
        try {
            // Arrêter le planificateur
            if (this.scheduler) {
                console.log('⏹️ Arrêt du planificateur...');
                this.scheduler.stop();
                this.scheduler = null;
            }

            // Fermer la connexion MongoDB
            await this.client.close();
            console.log('✅ Services arrêtés avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'arrêt des services:', error);
        }
    }
}

module.exports = new StartupService(); 
