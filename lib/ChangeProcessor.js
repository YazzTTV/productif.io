import { EventEmitter } from 'events';

/**
 * Change Processor - Traite les événements de changement et détermine les actions
 * Pont intelligent entre DatabaseWatcher et le planificateur
 */
class ChangeProcessor extends EventEmitter {
    constructor() {
        super();
        this.processingQueue = [];
        this.isProcessing = false;
        console.log('⚙️ ChangeProcessor initialisé');
    }

    /**
     * Démarre le processeur de changements
     */
    start() {
        console.log('🚀 ChangeProcessor démarré');
        this.emit('processor_started');
    }

    /**
     * Traite un événement de création d'utilisateur
     */
    async handleUserCreated(eventData) {
        console.log('\n' + '='.repeat(80));
        console.log('🎯 TRAITEMENT: NOUVEL UTILISATEUR');
        console.log('='.repeat(80));
        console.log(`👤 Utilisateur: ${eventData.email} (${eventData.userId})`);
        console.log(`⏰ Timestamp: ${eventData.timestamp}`);
        
        const action = this.analyzeNewUserAction(eventData);
        
        if (action.shouldAddToScheduler) {
            console.log('✅ ACTION: Ajouter au planificateur');
            
            this.emit('SCHEDULER_ACTION', {
                type: 'ADD_USER',
                userId: eventData.userId,
                settings: eventData.settings,
                priority: 'HIGH',
                reason: 'Nouvel utilisateur avec notifications activées'
            });
        } else {
            console.log('ℹ️ ACTION: Aucune action requise');
            console.log(`📝 Raison: ${action.reason}`);
        }
        
        console.log('='.repeat(80));
    }

    /**
     * Traite un événement de modification de préférences
     */
    async handleUserUpdated(eventData) {
        console.log('\n' + '='.repeat(80));
        console.log('🔄 TRAITEMENT: MODIFICATION UTILISATEUR');
        console.log('='.repeat(80));
        console.log(`👤 Utilisateur: ${eventData.email} (${eventData.userId})`);
        console.log(`⏰ Timestamp: ${eventData.timestamp}`);
        
        // Afficher les changements détectés
        console.log('📋 Changements détectés:');
        for (const [field, change] of Object.entries(eventData.changes)) {
            console.log(`   ${this.getFieldEmoji(field)} ${this.getFieldLabel(field)}: ${change.from} → ${change.to}`);
        }

        const action = this.analyzeUpdateAction(eventData);
        
        if (action.shouldUpdateScheduler) {
            console.log('✅ ACTION: Mettre à jour le planificateur');
            
            this.emit('SCHEDULER_ACTION', {
                type: 'UPDATE_USER',
                userId: eventData.userId,
                oldSettings: eventData.oldSettings,
                newSettings: eventData.newSettings,
                changes: eventData.changes,
                priority: action.priority,
                reason: action.reason
            });
        } else {
            console.log('ℹ️ ACTION: Aucune action requise');
            console.log(`📝 Raison: ${action.reason}`);
        }
        
        console.log('='.repeat(80));
    }

    /**
     * Traite un événement de suppression d'utilisateur
     */
    async handleUserDeleted(eventData) {
        console.log('\n' + '='.repeat(80));
        console.log('🗑️ TRAITEMENT: SUPPRESSION UTILISATEUR');
        console.log('='.repeat(80));
        console.log(`👤 Utilisateur: ${eventData.userId}`);
        console.log(`⏰ Timestamp: ${eventData.timestamp}`);
        
        console.log('✅ ACTION: Supprimer du planificateur');
        
        this.emit('SCHEDULER_ACTION', {
            type: 'REMOVE_USER',
            userId: eventData.userId,
            priority: 'HIGH',
            reason: 'Utilisateur supprimé de la base de données'
        });
        
        console.log('='.repeat(80));
    }

    /**
     * Analyse l'action à prendre pour un nouvel utilisateur
     */
    analyzeNewUserAction(eventData) {
        const settings = eventData.settings;
        
        // Vérifier si les notifications sont activées
        if (!settings.isEnabled) {
            return {
                shouldAddToScheduler: false,
                reason: 'Notifications désactivées pour cet utilisateur'
            };
        }

        // Vérifier si WhatsApp est configuré
        if (!settings.whatsappEnabled || !settings.whatsappNumber) {
            return {
                shouldAddToScheduler: false,
                reason: 'WhatsApp non configuré'
            };
        }

        // Vérifier si les horaires sont valides
        const requiredTimes = ['morningTime', 'noonTime', 'afternoonTime', 'eveningTime', 'nightTime', 'journalTime'];
        const missingTimes = requiredTimes.filter(time => !settings[time]);
        
        if (missingTimes.length > 0) {
            return {
                shouldAddToScheduler: false,
                reason: `Horaires manquants: ${missingTimes.join(', ')}`
            };
        }

        return {
            shouldAddToScheduler: true,
            reason: 'Utilisateur prêt pour la planification'
        };
    }

    /**
     * Analyse l'action à prendre pour une modification
     */
    analyzeUpdateAction(eventData) {
        const changes = eventData.changes;
        const newSettings = eventData.newSettings;
        
        // Vérifier si les notifications ont été désactivées
        if (changes.isEnabled && changes.isEnabled.to === false) {
            return {
                shouldUpdateScheduler: true,
                priority: 'HIGH',
                reason: 'Notifications désactivées - arrêt du planning'
            };
        }

        // Vérifier si les notifications ont été activées
        if (changes.isEnabled && changes.isEnabled.to === true) {
            return {
                shouldUpdateScheduler: true,
                priority: 'HIGH',
                reason: 'Notifications activées - démarrage du planning'
            };
        }

        // Vérifier si WhatsApp a été modifié
        if (changes.whatsappEnabled || changes.whatsappNumber) {
            return {
                shouldUpdateScheduler: true,
                priority: 'MEDIUM',
                reason: 'Configuration WhatsApp modifiée'
            };
        }

        // Vérifier si les horaires ont été modifiés
        const timeFields = ['morningTime', 'noonTime', 'afternoonTime', 'eveningTime', 'nightTime', 'journalTime'];
        const timeChanges = timeFields.filter(field => changes[field]);
        
        if (timeChanges.length > 0) {
            return {
                shouldUpdateScheduler: true,
                priority: 'HIGH',
                reason: `Horaires modifiés: ${timeChanges.join(', ')}`
            };
        }

        // Si notifications actives, toujours mettre à jour par sécurité
        if (newSettings.isEnabled) {
            return {
                shouldUpdateScheduler: true,
                priority: 'LOW',
                reason: 'Mise à jour préventive'
            };
        }

        return {
            shouldUpdateScheduler: false,
            reason: 'Aucun changement significatif détecté'
        };
    }

    /**
     * Obtient l'emoji correspondant au champ modifié
     */
    getFieldEmoji(field) {
        const emojis = {
            'isEnabled': '🔔',
            'morningTime': '🌅',
            'noonTime': '☀️',
            'afternoonTime': '🌤️',
            'eveningTime': '🌆',
            'nightTime': '🌙',
            'journalTime': '📔',
            'whatsappEnabled': '📱',
            'whatsappNumber': '📞'
        };
        return emojis[field] || '📝';
    }

    /**
     * Obtient le label lisible du champ
     */
    getFieldLabel(field) {
        const labels = {
            'isEnabled': 'Notifications',
            'morningTime': 'Matin',
            'noonTime': 'Midi',
            'afternoonTime': 'Après-midi',
            'eveningTime': 'Soir',
            'nightTime': 'Nuit',
            'journalTime': 'Journal',
            'whatsappEnabled': 'WhatsApp activé',
            'whatsappNumber': 'Numéro WhatsApp'
        };
        return labels[field] || field;
    }

    /**
     * Ajoute un événement à la queue de traitement
     */
    async queueEvent(eventType, eventData) {
        this.processingQueue.push({
            type: eventType,
            data: eventData,
            timestamp: new Date()
        });

        // Traiter immédiatement si pas en cours de traitement
        if (!this.isProcessing) {
            await this.processQueue();
        }
    }

    /**
     * Traite la queue d'événements
     */
    async processQueue() {
        if (this.isProcessing || this.processingQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.processingQueue.length > 0) {
            const event = this.processingQueue.shift();
            
            try {
                switch (event.type) {
                    case 'USER_PREFERENCES_CREATED':
                        await this.handleUserCreated(event.data);
                        break;
                    case 'USER_PREFERENCES_UPDATED':
                        await this.handleUserUpdated(event.data);
                        break;
                    case 'USER_PREFERENCES_DELETED':
                    case 'USER_DELETED':
                        await this.handleUserDeleted(event.data);
                        break;
                    default:
                        console.log(`⚠️ Type d'événement inconnu: ${event.type}`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors du traitement de l'événement ${event.type}:`, error);
            }
        }

        this.isProcessing = false;
    }

    /**
     * Obtient le statut du processeur
     */
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            queueLength: this.processingQueue.length,
            startTime: this.startTime || null
        };
    }
}

export default ChangeProcessor; 
