import { EventEmitter } from 'events';

export interface NotificationPreferencesUpdateEvent {
  userId: string;
  oldPreferences: any;
  newPreferences: any;
  timestamp: Date;
}

export interface SchedulerEvent {
  type: 'PREFERENCES_UPDATED' | 'USER_DELETED' | 'SCHEDULER_RESTART';
  data: any;
  userId?: string;
}

class EventManager extends EventEmitter {
  private static instance: EventManager;

  private constructor() {
    super();
    this.setMaxListeners(100); // Augmenter la limite pour éviter les warnings
  }

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * Émet un événement de mise à jour des préférences de notification
   */
  emitPreferencesUpdate(event: NotificationPreferencesUpdateEvent) {
    console.log(`📡 Émission événement: PREFERENCES_UPDATED pour utilisateur ${event.userId}`);
    this.emit('PREFERENCES_UPDATED', event);
  }

  /**
   * Émet un événement de suppression d'utilisateur
   */
  emitUserDeleted(userId: string) {
    console.log(`📡 Émission événement: USER_DELETED pour utilisateur ${userId}`);
    this.emit('USER_DELETED', { userId });
  }

  /**
   * Émet un événement de redémarrage du planificateur
   */
  emitSchedulerRestart() {
    console.log(`📡 Émission événement: SCHEDULER_RESTART`);
    this.emit('SCHEDULER_RESTART', {});
  }

  /**
   * S'abonner aux événements de mise à jour des préférences
   */
  onPreferencesUpdate(callback: (event: NotificationPreferencesUpdateEvent) => void) {
    this.on('PREFERENCES_UPDATED', callback);
  }

  /**
   * S'abonner aux événements de suppression d'utilisateur
   */
  onUserDeleted(callback: (data: { userId: string }) => void) {
    this.on('USER_DELETED', callback);
  }

  /**
   * S'abonner aux événements de redémarrage du planificateur
   */
  onSchedulerRestart(callback: () => void) {
    this.on('SCHEDULER_RESTART', callback);
  }

  /**
   * Désabonnement propre
   */
  removePreferencesUpdateListener(callback: (event: NotificationPreferencesUpdateEvent) => void) {
    this.off('PREFERENCES_UPDATED', callback);
  }

  removeUserDeletedListener(callback: (data: { userId: string }) => void) {
    this.off('USER_DELETED', callback);
  }

  removeSchedulerRestartListener(callback: () => void) {
    this.off('SCHEDULER_RESTART', callback);
  }

  /**
   * Nettoyer tous les listeners
   */
  cleanup() {
    this.removeAllListeners();
  }
}

export default EventManager; 