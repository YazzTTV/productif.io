import whatsappService from './whatsappService.js';
import NotificationScheduler from './NotificationScheduler.js';
import express from 'express';

const app = express();

// Variable globale pour le planificateur
let scheduler = null;

async function startSchedulerService() {
    try {
        console.log('🚀 Démarrage du service de planification...');
        console.log('🔄 AVEC SYSTÈME DE MISE À JOUR TEMPS RÉEL');

        // 1. Configurer le serveur Express pour le healthcheck
        app.use(express.json());

        // Route de santé pour Railway
        app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'scheduler',
                schedulerActive: scheduler !== null,
                realtimeUpdates: true // Indique que le système temps réel est actif
            });
        });

        // Route pour obtenir le statut complet du planificateur
        app.get('/status', (req, res) => {
            if (scheduler) {
                const status = scheduler.getStatus();
                res.json(status);
            } else {
                res.json({
                    isStarted: false,
                    activeJobs: 0,
                    realtimeUpdates: false,
                    eventListeners: false,
                    reactiveSystem: null,
                    jobs: []
                });
            }
        });

        // Alias pour /api/status
        app.get('/api/status', (req, res) => {
            if (scheduler) {
                const status = scheduler.getStatus();
                res.json(status);
            } else {
                res.json({
                    isStarted: false,
                    activeJobs: 0,
                    realtimeUpdates: false,
                    eventListeners: false,
                    reactiveSystem: null,
                    jobs: []
                });
            }
        });

        // Endpoint pour déclencher immédiatement le traitement des notifications
        app.post('/api/process-now', async (req, res) => {
            try {
                if (!scheduler) {
                    return res.status(503).json({ error: 'Scheduler non disponible' });
                }

                console.log('\n⚡ Déclenchement manuel du traitement des notifications');
                await scheduler.processNotifications();
                const status = scheduler.getStatus();
                return res.json({ success: true, activeJobs: status.activeJobs });
            } catch (error) {
                console.error('Erreur process-now:', error);
                return res.status(500).json({ error: 'Erreur lors du traitement immédiat' });
            }
        });

        // NOUVEAU : Endpoint pour recevoir les mises à jour de préférences depuis l'API Next.js
        app.post('/api/update-user', async (req, res) => {
            try {
                console.log('\n🔥 REQUÊTE HTTP REÇUE : MISE À JOUR UTILISATEUR');
                console.log('='.repeat(80));
                
                const { userId, oldPreferences, newPreferences, timestamp } = req.body;
                
                if (!userId || !newPreferences) {
                    console.log('❌ Données manquantes dans la requête');
                    return res.status(400).json({ error: 'userId et newPreferences requis' });
                }
                
                console.log(`👤 Utilisateur: ${userId}`);
                console.log(`⏰ Timestamp: ${timestamp}`);
                console.log('📡 Source: API Next.js → Scheduler Node.js');
                
                // Simuler un événement EventManager pour déclencher les logs détaillés
                const event = {
                    userId,
                    oldPreferences,
                    newPreferences,
                    timestamp: new Date(timestamp)
                };
                
                if (scheduler) {
                    // Appeler directement le gestionnaire de mise à jour
                    await scheduler.handlePreferencesUpdate(event);
                    
                    console.log('✅ TRAITEMENT TERMINÉ AVEC SUCCÈS !');
                    console.log('='.repeat(80));
                    
                    res.json({ 
                        success: true, 
                        message: 'Préférences mises à jour avec succès',
                        userId,
                        activeJobs: scheduler.jobs?.size || 0
                    });
                } else {
                    console.log('❌ Scheduler non disponible');
                    console.log('='.repeat(80));
                    res.status(503).json({ error: 'Scheduler non disponible' });
                }
            } catch (error) {
                console.log('\n❌ ERREUR LORS DU TRAITEMENT !');
                console.log('='.repeat(80));
                console.error('Erreur:', error);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        // 2. Démarrer le planificateur
        console.log('⚙️ Initialisation du planificateur...');
        scheduler = new NotificationScheduler(whatsappService);
        await scheduler.start();
        console.log('✅ Planificateur démarré');

        // 3. Démarrer le serveur pour le healthcheck
        // Sur Railway, l'application doit écouter sur PORT. On garde un fallback pour l'exécution locale.
        const port = Number(process.env.PORT || process.env.SCHEDULER_PORT) || 3002;
        app.listen(port, () => {
            console.log(`🌐 Serveur de monitoring démarré sur le port ${port}`);
            console.log(`📊 Status disponible sur http://localhost:${port}/status`);
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
        console.log('🎯 Prêt à recevoir les mises à jour de préférences !');
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