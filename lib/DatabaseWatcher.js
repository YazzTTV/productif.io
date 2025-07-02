import { EventEmitter } from 'events';

/**
 * Database Watcher - Surveille les changements dans la base de données
 * Sans modifier le fonctionnement existant du planificateur
 */
class DatabaseWatcher extends EventEmitter {
    constructor(prisma) {
        super();
        this.prisma = prisma;
        this.isWatching = false;
        this.watchInterval = null;
        this.lastCheckTimestamp = new Date();
        this.userPreferencesCache = new Map();
        
        console.log('🔍 DatabaseWatcher initialisé');
    }

    /**
     * Démarre la surveillance des changements
     */
    async startWatching() {
        if (this.isWatching) {
            console.log('⚠️ DatabaseWatcher déjà en cours d\'exécution');
            return;
        }

        console.log('🎯 Démarrage de la surveillance de la base de données...');
        
        // Initialiser le cache avec l'état actuel
        await this.initializeCache();
        
        // Démarrer la surveillance périodique
        this.isWatching = true;
        this.watchInterval = setInterval(() => {
            this.checkForChanges();
        }, 5000); // Vérification toutes les 5 secondes

        console.log('✅ DatabaseWatcher démarré - surveillance active');
    }

    /**
     * Arrête la surveillance
     */
    stopWatching() {
        if (!this.isWatching) return;

        console.log('🛑 Arrêt de la surveillance de la base de données...');
        this.isWatching = false;
        
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
            this.watchInterval = null;
        }

        console.log('✅ DatabaseWatcher arrêté');
    }

    /**
     * Initialise le cache avec l'état actuel de la base de données
     */
    async initializeCache() {
        try {
            console.log('🔄 Initialisation du cache DatabaseWatcher...');
            
            const users = await this.prisma.user.findMany({
                include: {
                    notificationSettings: true
                }
            });

            this.userPreferencesCache.clear();
            
            for (const user of users) {
                if (user.notificationSettings) {
                    this.userPreferencesCache.set(user.id, {
                        ...user.notificationSettings,
                        lastUpdated: user.notificationSettings.updatedAt
                    });
                }
            }

            console.log(`📊 Cache initialisé avec ${this.userPreferencesCache.size} utilisateurs`);
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du cache:', error);
        }
    }

    /**
     * Vérifie les changements depuis la dernière vérification
     */
    async checkForChanges() {
        try {
            const currentTime = new Date();
            
            // Récupérer tous les utilisateurs avec leurs préférences
            const users = await this.prisma.user.findMany({
                include: {
                    notificationSettings: true
                },
                where: {
                    OR: [
                        {
                            notificationSettings: {
                                updatedAt: {
                                    gt: this.lastCheckTimestamp
                                }
                            }
                        },
                        {
                            createdAt: {
                                gt: this.lastCheckTimestamp
                            }
                        }
                    ]
                }
            });

            // Analyser les changements
            for (const user of users) {
                await this.analyzeUserChanges(user);
            }

            // Vérifier les utilisateurs supprimés
            await this.checkForDeletedUsers();

            this.lastCheckTimestamp = currentTime;

        } catch (error) {
            console.error('❌ Erreur lors de la vérification des changements:', error);
        }
    }

    /**
     * Analyse les changements pour un utilisateur spécifique
     */
    async analyzeUserChanges(user) {
        const userId = user.id;
        const currentSettings = user.notificationSettings;
        const cachedSettings = this.userPreferencesCache.get(userId);

        // Nouvel utilisateur avec des préférences
        if (!cachedSettings && currentSettings) {
            console.log(`👤 NOUVEAU UTILISATEUR détecté: ${user.email}`);
            
            this.emit('USER_PREFERENCES_CREATED', {
                userId: userId,
                email: user.email,
                settings: currentSettings,
                timestamp: new Date()
            });

            // Mettre à jour le cache
            this.userPreferencesCache.set(userId, {
                ...currentSettings,
                lastUpdated: currentSettings.updatedAt
            });
            return;
        }

        // Modifications des préférences existantes
        if (cachedSettings && currentSettings) {
            const hasChanged = currentSettings.updatedAt > cachedSettings.lastUpdated;
            
            if (hasChanged) {
                console.log(`🔄 MODIFICATION des préférences détectée pour: ${user.email}`);
                
                const changes = this.detectSpecificChanges(cachedSettings, currentSettings);
                
                this.emit('USER_PREFERENCES_UPDATED', {
                    userId: userId,
                    email: user.email,
                    oldSettings: cachedSettings,
                    newSettings: currentSettings,
                    changes: changes,
                    timestamp: new Date()
                });

                // Mettre à jour le cache
                this.userPreferencesCache.set(userId, {
                    ...currentSettings,
                    lastUpdated: currentSettings.updatedAt
                });
            }
            return;
        }

        // Préférences supprimées
        if (cachedSettings && !currentSettings) {
            console.log(`🗑️ SUPPRESSION des préférences détectée pour: ${user.email}`);
            
            this.emit('USER_PREFERENCES_DELETED', {
                userId: userId,
                email: user.email,
                timestamp: new Date()
            });

            this.userPreferencesCache.delete(userId);
        }
    }

    /**
     * Détecte les changements spécifiques entre les anciennes et nouvelles préférences
     */
    detectSpecificChanges(oldSettings, newSettings) {
        const changes = {};
        
        const fieldsToWatch = [
            'isEnabled', 'morningTime', 'noonTime', 'afternoonTime', 
            'eveningTime', 'nightTime', 'whatsappEnabled', 'whatsappNumber'
        ];

        for (const field of fieldsToWatch) {
            if (oldSettings[field] !== newSettings[field]) {
                changes[field] = {
                    from: oldSettings[field],
                    to: newSettings[field]
                };
            }
        }

        return changes;
    }

    /**
     * Vérifie les utilisateurs supprimés de la base de données
     */
    async checkForDeletedUsers() {
        try {
            const existingUserIds = await this.prisma.user.findMany({
                select: { id: true }
            });
            
            const existingIds = new Set(existingUserIds.map(u => u.id));
            
            // Vérifier les utilisateurs dans le cache qui n'existent plus
            for (const [userId] of this.userPreferencesCache) {
                if (!existingIds.has(userId)) {
                    console.log(`🗑️ UTILISATEUR SUPPRIMÉ détecté: ${userId}`);
                    
                    this.emit('USER_DELETED', {
                        userId: userId,
                        timestamp: new Date()
                    });

                    this.userPreferencesCache.delete(userId);
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de la vérification des utilisateurs supprimés:', error);
        }
    }

    /**
     * Force une vérification immédiate
     */
    async forceCheck() {
        console.log('⚡ Vérification forcée des changements...');
        await this.checkForChanges();
    }

    /**
     * Obtient le statut de la surveillance
     */
    getStatus() {
        return {
            isWatching: this.isWatching,
            cachedUsers: this.userPreferencesCache.size,
            lastCheck: this.lastCheckTimestamp,
            uptime: this.isWatching ? Date.now() - this.lastCheckTimestamp : 0
        };
    }
}

export default DatabaseWatcher; 