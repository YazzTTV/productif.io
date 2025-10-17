import DatabaseWatcher from './DatabaseWatcher.js';
import ChangeProcessor from './ChangeProcessor.js';
import SchedulerBridge from './SchedulerBridge.js';
import { deepWorkScheduler } from './deepwork/DeepWorkScheduler.js';
import { morningInsightsScheduler } from './journal/MorningInsightsScheduler.js'

/**
 * Reactive Scheduler Manager - Orchestrateur principal du système réactif
 * Coordonne tous les composants sans modifier le planificateur existant
 */
class ReactiveSchedulerManager {
    constructor(notificationScheduler, prisma) {
        this.scheduler = notificationScheduler;
        this.prisma = prisma;
        
        // Initialiser les composants
        this.databaseWatcher = new DatabaseWatcher(prisma);
        this.changeProcessor = new ChangeProcessor();
        this.schedulerBridge = new SchedulerBridge(notificationScheduler);
        
        this.isStarted = false;
        this.healthCheckInterval = null;
        
        console.log('🎯 ReactiveSchedulerManager initialisé');
        this.setupEventListeners();
    }

    /**
     * Configure les listeners d'événements entre composants
     */
    setupEventListeners() {
        console.log('🔗 Configuration des liaisons entre composants...');

        // DatabaseWatcher → ChangeProcessor
        this.databaseWatcher.on('USER_PREFERENCES_CREATED', (data) => {
            this.changeProcessor.queueEvent('USER_PREFERENCES_CREATED', data);
        });

        this.databaseWatcher.on('USER_PREFERENCES_UPDATED', (data) => {
            this.changeProcessor.queueEvent('USER_PREFERENCES_UPDATED', data);
        });

        this.databaseWatcher.on('USER_PREFERENCES_DELETED', (data) => {
            this.changeProcessor.queueEvent('USER_PREFERENCES_DELETED', data);
        });

        this.databaseWatcher.on('USER_DELETED', (data) => {
            this.changeProcessor.queueEvent('USER_DELETED', data);
        });

        // ChangeProcessor → SchedulerBridge
        this.changeProcessor.on('SCHEDULER_ACTION', (actionData) => {
            this.schedulerBridge.handleSchedulerAction(actionData);
        });

        console.log('✅ Liaisons configurées avec succès');
    }

    /**
     * Démarre le système réactif complet
     */
    async start() {
        if (this.isStarted) {
            console.log('⚠️ ReactiveSchedulerManager déjà démarré');
            return;
        }

        console.log('\n' + '🚀'.repeat(50));
        console.log('🎯 DÉMARRAGE DU SYSTÈME RÉACTIF COMPLET');
        console.log('🚀'.repeat(50));

        try {
            // Étape 1: Démarrer les composants dans l'ordre
            console.log('📋 Étape 1: Démarrage des composants...');
            
            this.changeProcessor.start();
            this.schedulerBridge.start();
            // Démarrer le DeepWorkScheduler
            try {
                deepWorkScheduler.start();
            } catch (e) {
                console.error('Erreur démarrage DeepWorkScheduler:', e);
            }

            // Démarrer le MorningInsightsScheduler
            try {
                morningInsightsScheduler.start();
            } catch (e) {
                console.error('Erreur démarrage MorningInsightsScheduler:', e);
            }
            
            // Étape 2: Synchronisation initiale
            console.log('📋 Étape 2: Synchronisation initiale...');
            await this.schedulerBridge.synchronizeScheduler();
            
            // Étape 3: Démarrer la surveillance
                    console.log('📋 Étape 3: Activation de la surveillance...');
        await this.databaseWatcher.start();
            
            // Étape 4: Démarrer le monitoring de santé
            console.log('📋 Étape 4: Activation du monitoring...');
            this.startHealthCheck();
            
            this.isStarted = true;
            
            console.log('✅ SYSTÈME RÉACTIF OPÉRATIONNEL !');
            console.log('🚀'.repeat(50));
            
            this.logSystemStatus();

        } catch (error) {
            console.error('❌ Erreur lors du démarrage du système réactif:', error);
            throw error;
        }
    }

    /**
     * Arrête le système réactif
     */
    async stop() {
        if (!this.isStarted) {
            console.log('⚠️ ReactiveSchedulerManager déjà arrêté');
            return;
        }

        console.log('\n🛑 Arrêt du système réactif...');

        try {
            // Arrêter le monitoring
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = null;
            }

            // Arrêter la surveillance
            this.databaseWatcher.stopWatching();
            try {
                deepWorkScheduler.stop();
            } catch (e) {
                console.error('Erreur arrêt DeepWorkScheduler:', e);
            }
            
            this.isStarted = false;
            console.log('✅ Système réactif arrêté');

        } catch (error) {
            console.error('❌ Erreur lors de l\'arrêt:', error);
        }
    }

    /**
     * Démarre le monitoring de santé du système
     */
    startHealthCheck() {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 30000); // Vérification toutes les 30 secondes

        console.log('💓 Monitoring de santé activé (30s)');
    }

    /**
     * Effectue une vérification de santé du système
     */
    async performHealthCheck() {
        try {
            // Vérification simple sans référence circulaire
            const dbWatcherStatus = this.databaseWatcher.getStatus();
            const processorStatus = this.changeProcessor.getStatus();
            const bridgeStatus = this.schedulerBridge.getStatus();
            
            const issues = [];
            if (!dbWatcherStatus.isWatching) issues.push('DatabaseWatcher non actif');
            if (processorStatus.queueLength > 10) issues.push(`Queue ChangeProcessor surchargée`);
            if (bridgeStatus.queueLength > 5) issues.push(`Queue SchedulerBridge surchargée`);
            
            // Vérifier si des composants ont des problèmes
            if (issues.length > 0) {
                console.log('\n⚠️ PROBLÈMES DÉTECTÉS:');
                issues.forEach(issue => {
                    console.log(`   ❌ ${issue}`);
                });
                
                // Tentative de réparation automatique
                await this.autoRepair();
            }

            // Log périodique du statut (toutes les 10 vérifications)
            if (Math.random() < 0.1) { // ~10% de chance
                this.logSystemStatus();
            }

        } catch (error) {
            console.error('❌ Erreur lors de la vérification de santé:', error);
        }
    }

    /**
     * Tentative de réparation automatique
     */
    async autoRepair() {
        console.log('🔧 Tentative de réparation automatique...');

        try {
            // Re-synchroniser le planificateur
            await this.schedulerBridge.synchronizeScheduler();
            
            // Forcer une vérification de la base de données
            await this.databaseWatcher.forceCheck();
            
            console.log('✅ Réparation automatique terminée');

        } catch (error) {
            console.error('❌ Échec de la réparation automatique:', error);
        }
    }

    /**
     * Force une synchronisation complète
     */
    async forceSynchronization() {
        console.log('\n⚡ SYNCHRONISATION FORCÉE...');
        
        try {
            await this.schedulerBridge.synchronizeScheduler();
            await this.databaseWatcher.forceCheck();
            
            console.log('✅ Synchronisation forcée terminée');
            this.logSystemStatus();

        } catch (error) {
            console.error('❌ Erreur lors de la synchronisation forcée:', error);
        }
    }

    /**
     * Obtient le statut complet du système
     */
    getSystemStatus() {
        const dbWatcherStatus = this.databaseWatcher.getStatus();
        const processorStatus = this.changeProcessor.getStatus();
        const bridgeStatus = this.schedulerBridge.getStatus();
        
        const issues = [];
        
        // Vérifier les problèmes potentiels
        if (!dbWatcherStatus.isWatching) {
            issues.push('DatabaseWatcher non actif');
        }
        
        if (processorStatus.queueLength > 10) {
            issues.push(`Queue ChangeProcessor surchargée (${processorStatus.queueLength})`);
        }
        
        if (bridgeStatus.queueLength > 5) {
            issues.push(`Queue SchedulerBridge surchargée (${bridgeStatus.queueLength})`);
        }

        return {
            isStarted: this.isStarted,
            components: {
                databaseWatcher: dbWatcherStatus,
                changeProcessor: processorStatus,
                schedulerBridge: bridgeStatus
            },
            issues: issues,
            uptime: this.isStarted ? Date.now() - (this.startTime || Date.now()) : 0
        };
    }

    /**
     * Affiche le statut du système
     */
    logSystemStatus() {
        // Éviter la référence circulaire - obtenir les statuts directement
        const dbWatcherStatus = this.databaseWatcher.getStatus();
        const processorStatus = this.changeProcessor.getStatus();
        const bridgeStatus = this.schedulerBridge.getStatus();
        
        console.log('\n📊 STATUT SYSTÈME RÉACTIF');
        console.log('═'.repeat(50));
        console.log(`🚀 Statut: ${this.isStarted ? '✅ ACTIF' : '❌ ARRÊTÉ'}`);
        console.log(`👀 DatabaseWatcher: ${dbWatcherStatus.isWatching ? '✅' : '❌'} (${dbWatcherStatus.cachedUsers} utilisateurs)`);
        console.log(`⚙️ ChangeProcessor: ${processorStatus.isProcessing ? '🔄' : '⏸️'} (${processorStatus.queueLength} en queue)`);
        console.log(`🌉 SchedulerBridge: ${bridgeStatus.isExecutingActions ? '🔄' : '⏸️'} (${bridgeStatus.queueLength} en queue)`);
        console.log(`📋 Utilisateurs planifiés: ${bridgeStatus.scheduledUsers}`);
        
        // Vérifier les problèmes sans référence circulaire
        const issues = [];
        if (!dbWatcherStatus.isWatching) issues.push('DatabaseWatcher non actif');
        if (processorStatus.queueLength > 10) issues.push(`Queue ChangeProcessor surchargée`);
        if (bridgeStatus.queueLength > 5) issues.push(`Queue SchedulerBridge surchargée`);
        
        if (issues.length > 0) {
            console.log(`⚠️ Problèmes: ${issues.length}`);
        } else {
            console.log('✅ Aucun problème détecté');
        }
        
        console.log('═'.repeat(50));
    }

    /**
     * Ajoute un utilisateur manuellement (utile pour les tests)
     */
    async addUserManually(userId, settings) {
        console.log(`🔧 Ajout manuel de l'utilisateur: ${userId}`);
        
        await this.schedulerBridge.handleSchedulerAction({
            type: 'ADD_USER',
            userId: userId,
            settings: settings,
            priority: 'HIGH',
            reason: 'Ajout manuel via ReactiveSchedulerManager'
        });
    }

    /**
     * Supprime un utilisateur manuellement (utile pour les tests)
     */
    async removeUserManually(userId) {
        console.log(`🔧 Suppression manuelle de l'utilisateur: ${userId}`);
        
        await this.schedulerBridge.handleSchedulerAction({
            type: 'REMOVE_USER',
            userId: userId,
            priority: 'HIGH',
            reason: 'Suppression manuelle via ReactiveSchedulerManager'
        });
    }
}

export default ReactiveSchedulerManager; 