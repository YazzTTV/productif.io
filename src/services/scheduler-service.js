import whatsappService from './whatsappService.js';
import NotificationScheduler from './NotificationScheduler.js';
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();

// Variable globale pour le planificateur
let scheduler = null;

// Fonction pour attendre que la base de données soit prête et que les migrations soient appliquées
async function waitForDatabase(maxRetries = 30, delay = 2000) {
    const prisma = new PrismaClient();
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            // Tester la connexion en faisant une requête simple
            await prisma.$queryRaw`SELECT 1`;
            
            // Vérifier que les tables principales existent (test sur la table User)
            try {
                await prisma.user.findFirst({ take: 1 });
                console.log('✅ Base de données prête et migrations appliquées');
                await prisma.$disconnect();
                return true;
            } catch (tableError) {
                // Si la table n'existe pas, c'est que les migrations ne sont pas appliquées
                if (tableError.code === 'P2021' || tableError.code === 'P0002') {
                    console.log(`⏳ Tentative ${i + 1}/${maxRetries} - Les migrations ne sont pas encore appliquées...`);
                    if (i < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    } else {
                        console.error('❌ Les migrations ne sont pas appliquées après', maxRetries, 'tentatives');
                        await prisma.$disconnect();
                        throw new Error('Migrations non appliquées: ' + tableError.message);
                    }
                }
                throw tableError;
            }
        } catch (error) {
            console.log(`⏳ Tentative ${i + 1}/${maxRetries} - Attente de la base de données...`);
            console.log(`   Erreur: ${error.code || error.message}`);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('❌ Impossible de se connecter à la base de données après', maxRetries, 'tentatives');
                console.error('   Dernière erreur:', error.message);
                await prisma.$disconnect();
                throw error;
            }
        }
    }
}

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

        // Endpoint de test pour générer des logs
        app.get('/api/test-logs', (req, res) => {
            console.log('📝 TEST LOGS - Requête reçue à', new Date().toISOString());
            console.log('📊 Statut du scheduler:', scheduler ? 'ACTIF' : 'INACTIF');
            if (scheduler) {
                const status = scheduler.getStatus();
                console.log('📈 Jobs actifs:', status.activeJobs);
                console.log('🔄 Système réactif:', status.reactiveSystem?.isStarted ? 'ACTIF' : 'INACTIF');
            }
            res.json({ 
                success: true, 
                message: 'Logs générés - Vérifiez les Deploy Logs sur Railway',
                timestamp: new Date().toISOString(),
                schedulerActive: scheduler !== null
            });
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

        // Endpoint pour recharger les check-in schedules
        app.post('/api/reload-checkin-schedules', async (req, res) => {
            try {
                const { userId } = req.body;
                
                // Importer dynamiquement le BehaviorCheckInScheduler
                const { behaviorCheckInScheduler } = await import('../../lib/behavior/BehaviorCheckInScheduler.js');
                
                if (userId) {
                    // Recharger le schedule pour un utilisateur spécifique
                    await behaviorCheckInScheduler.updateUserSchedule(userId);
                    console.log(`✅ Check-in schedule rechargé pour l'utilisateur ${userId}`);
                    res.json({ success: true, message: `Schedule rechargé pour ${userId}` });
                } else {
                    // Recharger tous les schedules
                    await behaviorCheckInScheduler.reloadAllSchedules();
                    console.log('✅ Tous les check-in schedules rechargés');
                    res.json({ success: true, message: 'Tous les schedules rechargés' });
                }
            } catch (error) {
                console.error('❌ Erreur reload-checkin-schedules:', error);
                res.status(500).json({ error: 'Erreur serveur' });
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

        // 3. Démarrer le serveur pour le healthcheck AVANT le scheduler
        // Railway fournit PORT; local on peut utiliser SCHEDULER_PORT ou 3002
        const port = Number(process.env.PORT || process.env.SCHEDULER_PORT) || 3002;
        
        // Attendre que le serveur soit prêt avant de continuer
        await new Promise((resolve) => {
            app.listen(port, '0.0.0.0', () => {
                console.log(`🌐 Serveur de monitoring démarré sur le port ${port}`);
                console.log(`📊 Status disponible sur http://0.0.0.0:${port}/status`);
                console.log(`❤️ Healthcheck disponible sur http://0.0.0.0:${port}/health`);
                resolve();
            });
        });

        // 2. Attendre que la base de données soit prête (migrations terminées)
        console.log('⏳ Attente que la base de données soit prête...');
        try {
            await waitForDatabase();
        } catch (error) {
            console.error('❌ Erreur lors de la connexion à la base de données:', error);
            console.error('⚠️ Le serveur continue de fonctionner pour le healthcheck');
            // Ne pas faire échouer le service, mais le scheduler ne démarrera pas
            return;
        }

        // 3. Démarrer le planificateur (après le serveur pour que le healthcheck réponde rapidement)
        console.log('⚙️ Initialisation du planificateur...');
        try {
            scheduler = new NotificationScheduler(whatsappService);
            await scheduler.start();
            console.log('✅ Planificateur démarré');
        } catch (error) {
            console.error('⚠️ Erreur lors du démarrage du planificateur:', error);
            console.error('Stack:', error.stack);
            console.error('⚠️ Le serveur continue de fonctionner pour le healthcheck');
            // Ne pas faire échouer le service si le scheduler ne démarre pas
        }

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