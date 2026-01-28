import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import NotificationLogger from '../src/services/NotificationLogger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Database Watcher - Surveille les changements dans la base de données
 * Sans modifier le fonctionnement existant du planificateur
 */
class DatabaseWatcher extends EventEmitter {
    constructor() {
        super();
        this.prisma = new PrismaClient();
        this.userCache = new Map();
        this.isWatching = false;
        this.watchInterval = null;
        this.pollInterval = 5000;
        this.watcherId = uuidv4();
        this.scanCounter = 0;
        
        NotificationLogger.log('INFO', 'DATABASE_WATCHER_INIT', {
            watcherId: this.watcherId,
            pollInterval: this.pollInterval,
            initTime: new Date().toISOString()
        });
    }

    /**
     * Démarre la surveillance des changements
     */
    start() {
        if (this.isWatching) {
            NotificationLogger.log('WARN', 'DATABASE_WATCHER_ALREADY_RUNNING', {
                watcherId: this.watcherId
            });
            return;
        }

        NotificationLogger.log('INFO', 'DATABASE_WATCHER_START', {
            watcherId: this.watcherId,
            pollInterval: this.pollInterval
        });

        this.isWatching = true;
        this.watchInterval = setInterval(() => {
            this.scan().catch(error => {
                NotificationLogger.log('ERROR', 'DATABASE_WATCHER_SCAN_ERROR', {
                    watcherId: this.watcherId,
                    error: error.message,
                    stack: error.stack
                });
            });
        }, this.pollInterval);

        // Premier scan immédiat
        this.scan().catch(error => {
            NotificationLogger.log('ERROR', 'DATABASE_WATCHER_INITIAL_SCAN_ERROR', {
                watcherId: this.watcherId,
                error: error.message
            });
        });
    }

    /**
     * Arrête la surveillance
     */
    stop() {
        if (!this.isWatching) {
            NotificationLogger.log('WARN', 'DATABASE_WATCHER_NOT_RUNNING', {
                watcherId: this.watcherId
            });
            return;
        }

        NotificationLogger.log('INFO', 'DATABASE_WATCHER_STOP', {
            watcherId: this.watcherId,
            totalScans: this.scanCounter,
            cachedUsers: this.userCache.size
        });

        this.isWatching = false;
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
            this.watchInterval = null;
        }
    }

    /**
     * Initialise le cache avec l'état actuel de la base de données
     */
    async scan() {
        const scanId = uuidv4();
        const scanStart = Date.now();
        this.scanCounter++;
        
        // Log DEBUG supprimé

        try {
            const queryStart = Date.now();
            
            // Récupérer tous les utilisateurs avec leurs préférences
            const users = await this.prisma.user.findMany({
                include: {
                    notificationSettings: true
                }
            });

            const queryDuration = Date.now() - queryStart;
            
            // Log DEBUG supprimé

            const changes = {
                new: [],
                modified: [],
                deleted: []
            };

            // Analyser les nouveaux utilisateurs et modifications
            const analysisStart = Date.now();
            
            for (const user of users) {
                const userId = user.id;
                const currentSnapshot = this.createUserSnapshot(user);
                
                if (!this.userCache.has(userId)) {
                    // Nouvel utilisateur
                    changes.new.push({
                        userId,
                        email: user.email,
                        snapshot: currentSnapshot,
                        detectedAt: new Date().toISOString()
                    });
                    
                    NotificationLogger.log('INFO', 'NEW_USER_DETECTED', {
                        scanId,
                        userId,
                        email: user.email,
                        hasNotificationSettings: !!user.notificationSettings
                    });
                } else {
                    // Utilisateur existant - vérifier les changements
                    const previousSnapshot = this.userCache.get(userId);
                    const userChanges = this.detectUserChanges(previousSnapshot, currentSnapshot, userId);
                    
                    if (userChanges.hasChanges) {
                        changes.modified.push({
                            userId,
                            email: user.email,
                            changes: userChanges.changes,
                            previousSnapshot,
                            currentSnapshot,
                            detectedAt: new Date().toISOString()
                        });
                        
                        NotificationLogger.log('INFO', 'USER_CHANGES_DETECTED', {
                            scanId,
                            userId,
                            email: user.email,
                            changes: userChanges.changes,
                            changeCount: Object.keys(userChanges.changes).length
                        });
                    }
                }

                this.userCache.set(userId, currentSnapshot);
            }

            // Détecter les utilisateurs supprimés
            const currentUserIds = new Set(users.map(u => u.id));
            for (const [cachedUserId, cachedSnapshot] of this.userCache.entries()) {
                if (!currentUserIds.has(cachedUserId)) {
                    changes.deleted.push({
                        userId: cachedUserId,
                        email: cachedSnapshot.email,
                        snapshot: cachedSnapshot,
                        detectedAt: new Date().toISOString()
                    });
                    
                    NotificationLogger.log('INFO', 'USER_DELETED_DETECTED', {
                        scanId,
                        userId: cachedUserId,
                        email: cachedSnapshot.email
                    });
                    
                    this.userCache.delete(cachedUserId);
                }
            }

            const analysisDuration = Date.now() - analysisStart;
            const totalScanDuration = Date.now() - scanStart;

            // Émettre les événements pour les changements
            const eventStart = Date.now();
            let eventsEmitted = 0;

            for (const newUser of changes.new) {
                this.emit('userAdded', newUser);
                eventsEmitted++;
            }

            for (const modifiedUser of changes.modified) {
                this.emit('userModified', modifiedUser);
                eventsEmitted++;
            }

            for (const deletedUser of changes.deleted) {
                this.emit('userDeleted', deletedUser);
                eventsEmitted++;
            }

            const eventDuration = Date.now() - eventStart;

            // Log final du scan - DEBUG supprimé
            // NotificationLogger.logDatabaseWatcherScan({
            //     scanId,
            //     usersChecked: users.length,
            //     changesDetected: changes.new.length + changes.modified.length + changes.deleted.length,
            //     scanDuration: totalScanDuration,
            //     queryDuration,
            //     analysisDuration,
            //     eventDuration,
            //     eventsEmitted,
            //     newUsers: changes.new.length,
            //     modifiedUsers: changes.modified.length,
            //     deletedUsers: changes.deleted.length,
            //     cacheSize: this.userCache.size
            // });

        } catch (error) {
            const scanDuration = Date.now() - scanStart;
            
            NotificationLogger.log('ERROR', 'DATABASE_WATCHER_SCAN_FAILED', {
                watcherId: this.watcherId,
                scanId,
                scanDuration,
                error: error.message,
                stack: error.stack
            });
        }
    }

    createUserSnapshot(user) {
        const snapshot = {
            id: user.id,
            email: user.email,
            updatedAt: user.updatedAt?.toISOString(),
            notificationSettings: null,
            snapshotCreatedAt: new Date().toISOString()
        };

        if (user.notificationSettings) {
            snapshot.notificationSettings = {
                isEnabled: user.notificationSettings.isEnabled,
                whatsappEnabled: user.notificationSettings.whatsappEnabled,
                whatsappNumber: user.notificationSettings.whatsappNumber,
                morningTime: user.notificationSettings.morningTime,
                noonTime: user.notificationSettings.noonTime,
                afternoonTime: user.notificationSettings.afternoonTime,
                eveningTime: user.notificationSettings.eveningTime,
                nightTime: user.notificationSettings.nightTime,
                updatedAt: user.notificationSettings.updatedAt?.toISOString()
            };
        }

        return snapshot;
    }

    detectUserChanges(previousSnapshot, currentSnapshot, userId) {
        const changes = {};
        let hasChanges = false;

        // Vérifier les changements au niveau utilisateur
        if (previousSnapshot.updatedAt !== currentSnapshot.updatedAt) {
            changes.userUpdated = {
                from: previousSnapshot.updatedAt,
                to: currentSnapshot.updatedAt
            };
            hasChanges = true;
        }

        // Vérifier les changements des paramètres de notification
        const prevSettings = previousSnapshot.notificationSettings;
        const currSettings = currentSnapshot.notificationSettings;

        if (!prevSettings && currSettings) {
            changes.notificationSettingsAdded = currSettings;
            hasChanges = true;
            
            NotificationLogger.log('INFO', 'NOTIFICATION_SETTINGS_ADDED', {
                userId,
                settings: currSettings
            });
        } else if (prevSettings && !currSettings) {
            changes.notificationSettingsRemoved = prevSettings;
            hasChanges = true;
            
            NotificationLogger.log('INFO', 'NOTIFICATION_SETTINGS_REMOVED', {
                userId,
                previousSettings: prevSettings
            });
        } else if (prevSettings && currSettings) {
            // Comparer les paramètres spécifiques
            const settingsChanges = {};
            
            const fieldsToCheck = [
                'isEnabled', 'whatsappEnabled', 'whatsappNumber',
                'morningTime', 'noonTime', 'afternoonTime', 'eveningTime', 'nightTime'
            ];

            for (const field of fieldsToCheck) {
                if (prevSettings[field] !== currSettings[field]) {
                    settingsChanges[field] = {
                        from: prevSettings[field],
                        to: currSettings[field]
                    };
                    
                    // Log DEBUG supprimé
                }
            }

            if (Object.keys(settingsChanges).length > 0) {
                changes.notificationSettingsModified = settingsChanges;
                hasChanges = true;
            }
        }

        return { hasChanges, changes };
    }

    /**
     * Obtient le statut de la surveillance
     */
    getStatus() {
        return {
            watcherId: this.watcherId,
            isWatching: this.isWatching,
            pollInterval: this.pollInterval,
            cachedUsers: this.userCache.size,
            totalScans: this.scanCounter,
            lastScanTime: this.lastScanTime
        };
    }
}

export default DatabaseWatcher; 