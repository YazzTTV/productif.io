// Charger les variables d'environnement depuis .env en premier
import 'dotenv/config';

import NotificationScheduler from './NotificationScheduler.js';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Gestionnaire d'erreur global pour éviter que le processus ne plante
// Doit être défini AVANT tout le reste
process.on('uncaughtException', (error) => {
    console.error('❌ Erreur non capturée:', error);
    console.error('Stack:', error.stack);
    console.error('⚠️ Le serveur continue de fonctionner pour le healthcheck');
    // Ne pas faire planter le processus
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse rejetée non gérée:', reason);
    console.error('⚠️ Le serveur continue de fonctionner pour le healthcheck');
    // Ne pas faire planter le processus
});

const app = express();

// Variable globale pour le planificateur
let scheduler = null;
let serverStarted = false;

// Démarrer le serveur IMMÉDIATEMENT, avant toute autre opération
// Cela garantit que le healthcheck répond même si le reste du code échoue
const port = Number(process.env.PORT || process.env.SCHEDULER_PORT) || 3001;

// Configurer Express pour le healthcheck
app.use(express.json());

function requireSchedulerKey(req, res) {
    const requiredKey = process.env.SCHEDULER_API_KEY;
    if (!requiredKey) return true;
    const provided = req.headers['x-scheduler-key'] || req.headers['x-api-key'];
    if (provided !== requiredKey) {
        res.status(401).json({ error: 'Unauthorized' });
        return false;
    }
    return true;
}

// Route de santé pour Railway - doit répondre immédiatement
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'scheduler',
        schedulerActive: scheduler !== null,
        realtimeUpdates: false,
        timestamp: new Date().toISOString()
    });
});

// Démarrer le serveur de manière synchrone
const server = app.listen(port, '0.0.0.0', () => {
    serverStarted = true;
    console.log(`✅ Scheduler écoute sur le port ${port}`);
});

server.on('error', (err) => {
    console.error('❌ Erreur lors du démarrage du serveur:', err);
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    // Ne pas faire planter le processus - essayer de continuer
});

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
        console.log('🚀 Démarrage du service scheduler...');
        
        // Attendre que le serveur soit démarré (il devrait déjà l'être)
        if (!serverStarted) {
            console.log('⏳ Attente que le serveur démarre...');
            await new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (serverStarted) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                // Timeout après 5 secondes
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 5000);
            });
        }
        
        console.log('✅ Serveur Express démarré');

        // Maintenant que le serveur est prêt, on peut initialiser le reste
        console.log('🚀 Démarrage du service de planification...');

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
            res.json({ 
                success: true, 
                message: 'OK',
                timestamp: new Date().toISOString(),
                schedulerActive: scheduler !== null
            });
        });

        // Endpoint pour déclencher immédiatement le traitement des notifications
        app.post('/api/process-now', async (req, res) => {
            try {
                if (!requireSchedulerKey(req, res)) return;
                if (!scheduler) {
                    return res.status(503).json({ error: 'Scheduler non disponible' });
                }

                console.log('⚡ Déclenchement manuel du traitement des notifications');
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
                if (!requireSchedulerKey(req, res)) return;
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
                if (!requireSchedulerKey(req, res)) return;
                const { userId, oldPreferences, newPreferences, timestamp } = req.body;
                
                if (!userId || !newPreferences) {
                    return res.status(400).json({ error: 'userId et newPreferences requis' });
                }
                
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
                    
                    res.json({ 
                        success: true, 
                        message: 'Préférences mises à jour avec succès',
                        userId,
                        activeJobs: scheduler.jobs?.size || 0
                    });
                } else {
                    res.status(503).json({ error: 'Scheduler non disponible' });
                }
            } catch (error) {
                console.error('Erreur:', error);
                res.status(500).json({ error: 'Erreur serveur' });
            }
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
            scheduler = new NotificationScheduler();
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

        console.log('✅ Service de planification prêt');
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du service:', error);
        console.error('Stack:', error.stack);
        console.error('⚠️ Le serveur continue de fonctionner pour le healthcheck');
        // Ne pas faire planter le processus - le serveur doit continuer à répondre au healthcheck
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

// Démarrer le service avec gestion d'erreur
startSchedulerService().catch((error) => {
    console.error('❌ Erreur fatale lors du démarrage du service:', error);
    console.error('Stack:', error.stack);
    // Ne pas faire planter le processus - le serveur doit continuer à répondre au healthcheck
    // Le serveur Express devrait déjà être démarré à ce stade
}); 
