import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import NotificationService from './NotificationService.js';
import NotificationLogger from './NotificationLogger.js';
import EventManager from '../../lib/EventManager.js';
import { v4 as uuidv4 } from 'uuid';

class NotificationScheduler {
    constructor(prisma) {
        this.jobs = new Map();
        this.prisma = prisma || new PrismaClient();
        this.notificationService = NotificationService;
        this.eventManager = EventManager.getInstance();
        this.isStarted = false;
        this.isRunning = false;
        this.schedulerId = uuidv4();
        this.jobCounter = 0;
        
        // Configurer les listeners d'événements
        this.setupEventListeners();
        
        // Log de démarrage
        NotificationLogger.log('INFO', 'SCHEDULER_INIT', {
            schedulerId: this.schedulerId,
            pid: process.pid,
            initTime: new Date().toISOString()
        });
    }

    setupEventListeners() {
        // Écouter les mises à jour de préférences
        this.eventManager.onPreferencesUpdate(this.handlePreferencesUpdate.bind(this));
        
        // Écouter les suppressions d'utilisateurs
        this.eventManager.onUserDeleted(this.handleUserDeleted.bind(this));
        
        // Écouter les redémarrages du planificateur
        this.eventManager.onSchedulerRestart(this.handleSchedulerRestart.bind(this));
        
        // listeners configurés
    }

    /**
     * Gestionnaire des mises à jour de préférences
     */
    async handlePreferencesUpdate(event) {
        const { userId, oldPreferences, newPreferences } = event;
        
        try {
            await this.cleanupPendingNotifications(userId);
            
            await this.stopUserTasks(userId);
            
            // Vérifier si les notifications sont activées
            if (!newPreferences.isEnabled) {
                return;
            }
            
            await this.scheduleUserNotifications(userId, newPreferences);
        } catch (error) {
            NotificationLogger.logError(`Mise à jour des préférences pour ${event.userId}`, error);
        }
    }

    /**
     * Nettoie les notifications en attente pour un utilisateur
     */
    async cleanupPendingNotifications(userId) {
        try {
            const pendingNotifications = await this.prisma.notificationHistory.findMany({
                where: {
                    userId: userId,
                    status: 'pending'
                }
            });
            
            // Supprimer les notifications en attente
            const result = await this.prisma.notificationHistory.deleteMany({
                where: {
                    userId: userId,
                    status: 'pending'
                }
            });
            
        } catch (error) {
            NotificationLogger.logError(`Nettoyage des notifications pour ${userId}`, error);
        }
    }

    /**
     * Gestionnaire de suppression d'utilisateur
     */
    async handleUserDeleted(data) {
        await this.stopUserTasks(data.userId);
    }

    /**
     * Gestionnaire de redémarrage du planificateur
     */
    async handleSchedulerRestart() {
        await this.stop();
        await this.start();
    }

    /**
     * Arrête toutes les tâches d'un utilisateur spécifique
     */
    async stopUserTasks(userId) {
        const userJobs = Array.from(this.jobs.keys()).filter(jobId => jobId.startsWith(`${userId}-`));
        if (userJobs.length === 0) {
            return;
        }

        for (const jobId of userJobs) {
            const job = this.jobs.get(jobId);
            if (job) {
                job.stop();
                this.jobs.delete(jobId);
            }
        }

        // tâches arrêtées
    }

    async start() {
        if (this.isStarted) {
            console.log('⚠️ Le planificateur est déjà démarré');
            return;
        }

        console.log('🚀 Démarrage du planificateur...');

        try {
            // Récupérer tous les utilisateurs avec leurs préférences
            const users = await this.prisma.user.findMany({
                include: {
                    notificationSettings: true
                }
            });

            console.log(`📊 Utilisateurs trouvés : ${users.length}`);

            for (const user of users) {
                if (!user.notificationSettings) {
                    // pas de préférences
                    continue;
                }

                const settings = user.notificationSettings;
                NotificationLogger.logNotificationSettings(settings);

                if (!settings.isEnabled) {
                    // notifications désactivées
                    continue;
                }

                // Planifier les notifications pour chaque utilisateur
                await this.scheduleUserNotifications(user.id, settings);
            }
            
            // Planifier le traitement des notifications
            this.scheduleNotificationProcessing();
            
            // Planifier le nettoyage des anciennes notifications
            this.scheduleCleanup();

            // Scanner les fenêtres de focus libres en journée
            this.scheduleFocusWindowScan();

            this.isStarted = true;
            
            console.log('✅ Planificateur démarré');
        }
        catch (error) {
            NotificationLogger.logError('Démarrage du planificateur', error);
            throw error;
        }
    }

    async scheduleUserNotifications(userId, settings) {
        try {
            const { morningTime, noonTime, afternoonTime, eveningTime, nightTime, improvementTime } = settings;
            const journalTime = settings.journalTime || settings.recapTime;

            // Validation des horaires pour éviter les doublons
            const times = [morningTime, noonTime, afternoonTime, eveningTime, nightTime, improvementTime, journalTime];
            const uniqueTimes = [...new Set(times)];
            
            // Vérifier si les horaires sont dans le futur proche (éviter cascade)
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            const timesToSchedule = [];
            
            // Notification du matin
            if (settings.morningReminder && this.isValidSchedulingTime(morningTime, currentTime)) {
                timesToSchedule.push({
                    time: morningTime,
                    type: 'matin',
                    label: 'morning',
                    callback: async (date) => {
                        await this.notificationService.scheduleMorningAnchor(userId, date);
                        await this.notificationService.scheduleMorningNotification(userId, date);
                    }
                });
            }

            // Notification du midi
            if (settings.noonReminder && this.isValidSchedulingTime(noonTime, currentTime)) {
                timesToSchedule.push({
                    time: noonTime,
                    type: 'midi',
                    label: 'noon',
                    callback: async (date) => {
                        await this.notificationService.scheduleNoonNotification(userId, date);
                        await this.notificationService.scheduleLunchBreak(userId, date);
                    }
                });
            }

            // Notification de l'après-midi
            if (settings.afternoonReminder && this.isValidSchedulingTime(afternoonTime, currentTime)) {
                timesToSchedule.push({
                    time: afternoonTime,
                    type: 'après-midi',
                    label: 'afternoon',
                    callback: async (date) => await this.notificationService.scheduleAfternoonNotification(userId, date)
                });
            }

            // Notification du soir
            if (settings.eveningReminder && this.isValidSchedulingTime(eveningTime, currentTime)) {
                timesToSchedule.push({
                    time: eveningTime,
                    type: 'soir',
                    label: 'evening',
                    callback: async (date) => {
                        await this.notificationService.scheduleEveningNotification(userId, date);
                        await this.notificationService.scheduleEveningPlan(userId, date);
                    }
                });
            }

            // Notification de nuit
            if (settings.nightReminder && this.isValidSchedulingTime(nightTime, currentTime)) {
                timesToSchedule.push({
                    time: nightTime,
                    type: 'nuit',
                    label: 'night',
                    callback: async (date) => await this.notificationService.scheduleNightNotification(userId, date)
                });
            }

            // Notification amélioration
            if (settings.improvementReminder && this.isValidSchedulingTime(improvementTime, currentTime)) {
                timesToSchedule.push({
                    time: improvementTime,
                    type: 'amelioration',
                    label: 'improvement',
                    callback: async (date) => await this.notificationService.scheduleImprovementNotification(userId, date)
                });
            }

            // Notification récap analyse
            if (settings.recapReminder && this.isValidSchedulingTime(journalTime, currentTime)) {
                timesToSchedule.push({
                    time: journalTime,
                    type: 'journal',
                    label: 'journal',
                    callback: async (date) => await this.notificationService.scheduleJournalPrompt(userId, date)
                });
            }

            // Check-ins Premium (timing aléatoire dans les fenêtres configurées)
            const premiumCheckConfigs = [
                {
                    enabled: settings.stressEnabled,
                    windows: settings.stressWindows || [],
                    count: settings.stressDailyCount || 1,
                    label: 'stress-premium',
                    callback: async (date) => await this.notificationService.scheduleStressCheckPremium(userId, date)
                },
                {
                    enabled: settings.moodEnabled,
                    windows: settings.moodWindows || [],
                    count: settings.moodDailyCount || 1,
                    label: 'mood-premium',
                    callback: async (date) => await this.notificationService.scheduleMoodCheckPremium(userId, date)
                },
                {
                    enabled: settings.focusEnabled,
                    windows: settings.focusWindows || [],
                    count: settings.focusDailyCount || 1,
                    label: 'focus-premium',
                    callback: async (date) => await this.notificationService.scheduleFocusCheckPremium(userId, date)
                }
            ];

            for (const config of premiumCheckConfigs) {
                if (!config.enabled || config.count <= 0 || !config.windows?.length) continue;
                const randomTimes = this.generateRandomTimesFromWindows(config.windows, config.count);
                for (const time of randomTimes) {
                    if (this.isValidSchedulingTime(time, currentTime)) {
                        timesToSchedule.push({
                            time: time,
                            type: config.label,
                            label: config.label,
                            callback: config.callback
                        });
                    }
                }
            }

            // Planifier seulement les horaires valides et uniques
            const uniqueTimesToSchedule = timesToSchedule.filter((item, index, self) => 
                index === self.findIndex(t => t.time === item.time && t.label === item.label)
            );

            for (const item of uniqueTimesToSchedule) {
                this.scheduleDailyNotification(userId, item.time, item.callback, settings.timezone, item.label || item.type);
            }

            // Les check-ins basiques ont été supprimés, seuls les Premium existent maintenant

        }
        catch (error) {
            NotificationLogger.logError(`Planification des notifications pour l'utilisateur ${userId}`, error);
        }
    }

    /**
     * Vérifie si un horaire est valide pour planification (pas trop proche du moment actuel)
     */
    isValidSchedulingTime(scheduleTime, currentTime) {
        // Autoriser désormais la planification même si l'horaire est imminent
        // Node-cron gère correctement une première exécution à la prochaine minute
        // et nous évitons de rater des tests manuels après modification des préférences.
        return true;
    }

    scheduleDailyNotification(userId, time, callback, timezone = 'UTC', label = '') {
        const jobId = `${userId}-${time}${label ? `-${label}` : ''}`;
        if (this.jobs.has(jobId)) {
            // job déjà existant
            return;
        }
        
        const [hours, minutes] = time.split(':').map(Number);
        const cronExpression = `${minutes} ${hours} * * *`;

        if (!cron.validate(cronExpression)) {
            console.log(`❌ Expression cron invalide: ${cronExpression}`);
            NotificationLogger.logError('Validation de l\'expression cron', new Error(`Expression cron invalide : ${cronExpression}`));
            return;
        }

        const job = cron.schedule(cronExpression, async () => {
            try {
                const now = new Date();
                await callback(now);
            }
            catch (error) {
                NotificationLogger.logError('Exécution de la tâche planifiée', error);
            }
        }, { timezone });

        this.jobs.set(jobId, job);
        // tâche créée
    }

    /**
     * Génère des horaires aléatoires dans des fenêtres données (HH:MM)
     */
    generateRandomTimesFromWindows(windows, count) {
        const times = [];
        const safeCount = Math.max(0, Math.min(count || 0, 5)); // éviter d'inonder
        for (let i = 0; i < safeCount; i++) {
            const window = windows[Math.floor(Math.random() * windows.length)];
            if (!window?.start || !window?.end) continue;
            const [sh, sm] = window.start.split(':').map(Number);
            const [eh, em] = window.end.split(':').map(Number);
            const startMinutes = sh * 60 + (sm || 0);
            const endMinutes = eh * 60 + (em || 0);
            if (endMinutes <= startMinutes) continue;
            const delta = endMinutes - startMinutes;
            const offset = Math.floor(Math.random() * delta);
            const total = startMinutes + offset;
            const hh = Math.floor(total / 60).toString().padStart(2, '0');
            const mm = (total % 60).toString().padStart(2, '0');
            times.push(`${hh}:${mm}`);
        }
        return times;
    }

    scheduleNotificationProcessing() {
        const job = cron.schedule('* * * * *', async () => {
            try {
                await this.processNotifications();
            }
            catch (error) {
                NotificationLogger.logError('Traitement des notifications', error);
            }
        });
        this.jobs.set('processNotifications', job);
        // tâche processNotifications planifiée
    }

    scheduleFocusWindowScan() {
        const job = cron.schedule('*/10 9-18 * * *', async () => {
            try {
                const users = await this.prisma.user.findMany({
                    where: {
                        notificationSettings: {
                            is: {
                                isEnabled: true,
                                pushEnabled: true
                            }
                        }
                    },
                    select: { id: true }
                });
                let processed = 0;
                let notificationsCreated = 0;
                let skipped = 0;
                
                for (const user of users) {
                    const result = await this.notificationService.scheduleFocusWindow(user.id);
                    processed++;
                    if (result?.created) {
                        notificationsCreated++;
                    } else if (result?.skipped) {
                        skipped++;
                    }
                }
                
                // no log
            } catch (error) {
                console.error(`🔎 [FOCUS_WINDOW_SCAN] ❌ Erreur:`, error.message);
                NotificationLogger.logError('Scan Focus Window', error);
            }
        });
        this.jobs.set('focusWindowScan', job);
        // tâche focusWindowScan planifiée
    }

    async processNotifications() {
        try {
            const now = new Date();
            // Élargir la fenêtre : 10 minutes dans le passé (pour rattraper les notifications manquées) et 2 minutes dans le futur
            const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
            const twoMinutesInFuture = new Date(now.getTime() + 2 * 60 * 1000);

            // Récupérer les notifications en attente qui doivent être envoyées
            const pendingNotifications = await this.prisma.notificationHistory.findMany({
                where: {
                    status: 'pending',
                    scheduledFor: {
                        gte: tenMinutesAgo,
                        lte: twoMinutesInFuture
                    }
                },
                include: {
                    user: {
                        include: {
                            notificationSettings: true
                        }
                    }
                }
            });

            if (pendingNotifications.length > 0) {
                for (const notification of pendingNotifications) {
                    try {
                        await this.notificationService.processNotification(notification);
                    }
                    catch (error) {
                        NotificationLogger.logError(`Traitement de la notification ${notification.id}`, error);
                    }
                }
            }
        }
        catch (error) {
            NotificationLogger.logError('Processus de vérification des notifications', error);
        }
    }

    scheduleCleanup() {
        // Nettoyer les notifications plus vieilles que 7 jours à minuit
        const job = cron.schedule('0 0 * * *', async () => {
            try {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const result = await this.prisma.notificationHistory.deleteMany({
                    where: {
                        scheduledFor: {
                            lt: sevenDaysAgo
                        }
                    }
                });
                // nettoyage effectué
            }
            catch (error) {
                NotificationLogger.logError('Nettoyage des notifications', error);
            }
        });
        this.jobs.set('cleanup', job);
        // tâche nettoyage planifiée
    }

    stop() {
        console.log('🛑 Arrêt du planificateur...');
        
        this.jobs.forEach((job, id) => {
            job.stop();
            // tâche arrêtée
        });
        this.jobs.clear();
        this.isStarted = false;
        console.log('✅ Planificateur arrêté');
    }

    /**
     * Met à jour le planning d'un utilisateur spécifique
     */
    async updateUserSchedule(userId) {
        try {
            // mise à jour planning
            
            // Récupérer les nouvelles préférences
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { notificationSettings: true }
            });
            
            if (!user || !user.notificationSettings) {
                // utilisateur ou préférences non trouvés
                return;
            }
            
            // Arrêter les anciennes tâches
            await this.stopUserTasks(userId);
            
            // Replanifier si activé
            if (user.notificationSettings.isEnabled) {
                await this.scheduleUserNotifications(userId, user.notificationSettings);
                // planning mis à jour
            } else {
                // notifications désactivées
            }
        } catch (error) {
            NotificationLogger.logError(`Mise à jour du planning pour ${userId}`, error);
        }
    }

    /**
     * Retourne le statut du planificateur
     */
    getStatus() {
        return {
            isStarted: this.isStarted,
            activeJobs: this.jobs.size,
            realtimeUpdates: false,
            eventListeners: true,
            jobs: Array.from(this.jobs.keys())
        };
    }

}

export default NotificationScheduler;
