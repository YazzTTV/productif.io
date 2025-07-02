/**
 * Scheduler Bridge - Interface entre le système réactif et le planificateur existant
 * N'effectue AUCUNE modification sur le planificateur actuel
 */
class SchedulerBridge {
    constructor(notificationScheduler) {
        this.scheduler = notificationScheduler;
        this.actionQueue = [];
        this.isExecutingActions = false;
        console.log('🌉 SchedulerBridge initialisé');
    }

    /**
     * Démarre le bridge
     */
    start() {
        console.log('🚀 SchedulerBridge activé');
    }

    /**
     * Traite une action du ChangeProcessor
     */
    async handleSchedulerAction(actionData) {
        console.log('\n' + '🌉'.repeat(30));
        console.log('🎯 BRIDGE: ACTION PLANIFICATEUR');
        console.log('🌉'.repeat(30));
        console.log(`📋 Type: ${actionData.type}`);
        console.log(`👤 Utilisateur: ${actionData.userId}`);
        console.log(`⚡ Priorité: ${actionData.priority}`);
        console.log(`📝 Raison: ${actionData.reason}`);

        // Ajouter à la queue avec priorité
        this.actionQueue.push({
            ...actionData,
            timestamp: new Date()
        });

        // Trier par priorité (HIGH > MEDIUM > LOW)
        this.actionQueue.sort((a, b) => {
            const priorities = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
            return priorities[b.priority] - priorities[a.priority];
        });

        // Exécuter immédiatement si pas en cours
        if (!this.isExecutingActions) {
            await this.executeActions();
        }

        console.log('🌉'.repeat(30));
    }

    /**
     * Exécute les actions en queue
     */
    async executeActions() {
        if (this.isExecutingActions || this.actionQueue.length === 0) {
            return;
        }

        this.isExecutingActions = true;

        while (this.actionQueue.length > 0) {
            const action = this.actionQueue.shift();
            
            try {
                await this.executeAction(action);
                
                // Petite pause entre les actions pour éviter la surcharge
                await this.sleep(100);
                
            } catch (error) {
                console.error(`❌ Erreur lors de l'exécution de l'action ${action.type}:`, error);
            }
        }

        this.isExecutingActions = false;
    }

    /**
     * Exécute une action spécifique
     */
    async executeAction(action) {
        switch (action.type) {
            case 'ADD_USER':
                await this.addUserToScheduler(action);
                break;
            case 'UPDATE_USER':
                await this.updateUserInScheduler(action);
                break;
            case 'REMOVE_USER':
                await this.removeUserFromScheduler(action);
                break;
            default:
                console.log(`⚠️ Type d'action inconnu: ${action.type}`);
        }
    }

    /**
     * Ajoute un utilisateur au planificateur
     */
    async addUserToScheduler(action) {
        console.log('➕ EXÉCUTION: Ajout utilisateur au planificateur');
        console.log(`   👤 Utilisateur: ${action.userId}`);
        
        try {
            // Utiliser la méthode existante du planificateur
            await this.scheduler.scheduleUserNotifications(action.userId, action.settings);
            
            console.log('   ✅ Utilisateur ajouté avec succès au planificateur');
            
        } catch (error) {
            console.error('   ❌ Erreur lors de l\'ajout:', error.message);
            
            // Réessayer une fois en cas d'erreur
            try {
                console.log('   🔄 Nouvelle tentative...');
                await this.scheduler.scheduleUserNotifications(action.userId, action.settings);
                console.log('   ✅ Réussi à la deuxième tentative');
            } catch (retryError) {
                console.error('   ❌ Échec définitif:', retryError.message);
            }
        }
    }

    /**
     * Met à jour un utilisateur dans le planificateur
     */
    async updateUserInScheduler(action) {
        console.log('🔄 EXÉCUTION: Mise à jour utilisateur dans le planificateur');
        console.log(`   👤 Utilisateur: ${action.userId}`);
        
        try {
            // Utiliser la méthode existante de mise à jour
            if (this.scheduler.updateUserSchedule) {
                await this.scheduler.updateUserSchedule(action.userId);
                console.log('   ✅ Utilisateur mis à jour avec succès');
            } else {
                // Fallback: arrêter et re-planifier
                console.log('   🔄 Fallback: Arrêt et re-planification...');
                await this.scheduler.stopUserTasks(action.userId);
                await this.scheduler.scheduleUserNotifications(action.userId, action.newSettings);
                console.log('   ✅ Utilisateur re-planifié avec succès');
            }
            
        } catch (error) {
            console.error('   ❌ Erreur lors de la mise à jour:', error.message);
        }
    }

    /**
     * Supprime un utilisateur du planificateur
     */
    async removeUserFromScheduler(action) {
        console.log('🗑️ EXÉCUTION: Suppression utilisateur du planificateur');
        console.log(`   👤 Utilisateur: ${action.userId}`);
        
        try {
            // Utiliser la méthode existante d'arrêt des tâches
            await this.scheduler.stopUserTasks(action.userId);
            
            console.log('   ✅ Utilisateur supprimé avec succès du planificateur');
            
        } catch (error) {
            console.error('   ❌ Erreur lors de la suppression:', error.message);
        }
    }

    /**
     * Vérifie si un utilisateur est déjà planifié
     */
    isUserScheduled(userId) {
        if (!this.scheduler.jobs) return false;
        
        // Vérifier si des tâches existent pour cet utilisateur
        const userJobs = Array.from(this.scheduler.jobs.keys()).filter(jobId => 
            jobId.startsWith(`${userId}-`)
        );
        
        return userJobs.length > 0;
    }

    /**
     * Obtient la liste des utilisateurs actuellement planifiés
     */
    getScheduledUsers() {
        if (!this.scheduler.jobs) return [];
        
        const userIds = new Set();
        
        for (const jobId of this.scheduler.jobs.keys()) {
            if (jobId.includes('-') && !['processNotifications', 'cleanup'].includes(jobId)) {
                const userId = jobId.split('-')[0];
                userIds.add(userId);
            }
        }
        
        return Array.from(userIds);
    }

    /**
     * Synchronise le planificateur avec l'état de la base de données
     */
    async synchronizeScheduler() {
        console.log('\n🔄 SYNCHRONISATION du planificateur...');
        
        try {
            // Récupérer tous les utilisateurs actifs de la base
            const activeUsers = await this.scheduler.prisma.user.findMany({
                include: {
                    notificationSettings: true
                },
                where: {
                    notificationSettings: {
                        isEnabled: true,
                        whatsappEnabled: true
                    }
                }
            });

            const activeUserIds = activeUsers.map(u => u.id);
            const scheduledUserIds = this.getScheduledUsers();

            console.log(`📊 Utilisateurs actifs en base: ${activeUserIds.length}`);
            console.log(`📊 Utilisateurs planifiés: ${scheduledUserIds.length}`);

            // Trouver les utilisateurs manquants dans le planificateur
            const missingUsers = activeUsers.filter(user => 
                !scheduledUserIds.includes(user.id)
            );

            // Trouver les utilisateurs planifiés mais plus actifs
            const obsoleteUserIds = scheduledUserIds.filter(userId => 
                !activeUserIds.includes(userId)
            );

            console.log(`➕ Utilisateurs à ajouter: ${missingUsers.length}`);
            console.log(`🗑️ Utilisateurs à supprimer: ${obsoleteUserIds.length}`);

            // Ajouter les utilisateurs manquants
            for (const user of missingUsers) {
                console.log(`   ➕ Ajout: ${user.email}`);
                await this.addUserToScheduler({
                    userId: user.id,
                    settings: user.notificationSettings
                });
            }

            // Supprimer les utilisateurs obsolètes
            for (const userId of obsoleteUserIds) {
                console.log(`   🗑️ Suppression: ${userId}`);
                await this.removeUserFromScheduler({ userId });
            }

            console.log('✅ Synchronisation terminée');

        } catch (error) {
            console.error('❌ Erreur lors de la synchronisation:', error);
        }
    }

    /**
     * Utilitaire pour les pauses
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obtient le statut du bridge
     */
    getStatus() {
        return {
            isExecutingActions: this.isExecutingActions,
            queueLength: this.actionQueue.length,
            scheduledUsers: this.getScheduledUsers().length,
            schedulerBasicInfo: {
                isStarted: this.scheduler.isStarted,
                activeJobs: this.scheduler.jobs ? this.scheduler.jobs.size : 0
            }
        };
    }
}

export default SchedulerBridge; 