import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import NotificationService from './NotificationService.js';
import NotificationLogger from './NotificationLogger.js';
import EventManager from '../../lib/EventManager.js';
import ReactiveSchedulerManager from '../../lib/ReactiveSchedulerManager.js';
import { v4 as uuidv4 } from 'uuid';

class NotificationScheduler {
    constructor(whatsappService, prisma) {
        this.jobs = new Map();
        this.prisma = prisma || new PrismaClient();
        this.notificationService = NotificationService;
        this.whatsappService = whatsappService;
        this.eventManager = EventManager.getInstance();
        this.isStarted = false;
        this.isRunning = false;
        this.schedulerId = uuidv4();
        this.jobCounter = 0;
        
        // Initialiser le système réactif
        this.reactiveManager = new ReactiveSchedulerManager(this, this.prisma);
        
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
        
        console.log('🎧 EventListeners configurés pour le planificateur');
        console.log('📡 Le scheduler écoute maintenant les événements en temps réel :');
        console.log('   • PREFERENCES_UPDATED');
        console.log('   • USER_DELETED');
        console.log('   • SCHEDULER_RESTART');
        console.log('');
    }

    /**
     * Gestionnaire des mises à jour de préférences
     */
    async handlePreferencesUpdate(event) {
        console.log('\n' + '='.repeat(80));
        console.log('🔥 ÉVÉNEMENT REÇU : MISE À JOUR DES PRÉFÉRENCES');
        console.log('='.repeat(80));
        console.log(`👤 Utilisateur: ${event.userId}`);
        console.log(`⏰ Timestamp: ${event.timestamp}`);
        console.log('📋 Changements détectés:');
        
        const { userId, oldPreferences, newPreferences } = event;
        
        // Afficher les changements
        if (oldPreferences.morningTime !== newPreferences.morningTime) {
            console.log(`   🌅 Matin: ${oldPreferences.morningTime} → ${newPreferences.morningTime}`);
        }
        if (oldPreferences.noonTime !== newPreferences.noonTime) {
            console.log(`   ☀️ Midi: ${oldPreferences.noonTime} → ${newPreferences.noonTime}`);
        }
        if (oldPreferences.afternoonTime !== newPreferences.afternoonTime) {
            console.log(`   🌤️ Après-midi: ${oldPreferences.afternoonTime} → ${newPreferences.afternoonTime}`);
        }
        if (oldPreferences.eveningTime !== newPreferences.eveningTime) {
            console.log(`   🌆 Soir: ${oldPreferences.eveningTime} → ${newPreferences.eveningTime}`);
        }
        if (oldPreferences.nightTime !== newPreferences.nightTime) {
            console.log(`   🌙 Nuit: ${oldPreferences.nightTime} → ${newPreferences.nightTime}`);
        }
        if (oldPreferences.isEnabled !== newPreferences.isEnabled) {
            console.log(`   🔔 Notifications: ${oldPreferences.isEnabled ? '✅' : '❌'} → ${newPreferences.isEnabled ? '✅' : '❌'}`);
        }
        
        try {
            console.log('\n🧹 ÉTAPE 0: Nettoyage des notifications en attente...');
            await this.cleanupPendingNotifications(userId);
            
            console.log('\n🛑 ÉTAPE 1: Arrêt des anciennes tâches...');
            await this.stopUserTasks(userId);
            
            // Vérifier si les notifications sont activées
            if (!newPreferences.isEnabled) {
                console.log('❌ Notifications désactivées - aucune nouvelle tâche planifiée');
                console.log('='.repeat(80));
                return;
            }
            
            console.log('🚀 ÉTAPE 2: Planification des nouvelles tâches...');
            await this.scheduleUserNotifications(userId, newPreferences);
            
            console.log('\n✅ MISE À JOUR TERMINÉE AVEC SUCCÈS !');
            console.log(`🎯 Utilisateur ${userId} maintenant à jour`);
            console.log('='.repeat(80));
        } catch (error) {
            console.log('\n❌ ERREUR LORS DE LA MISE À JOUR !');
            console.log('='.repeat(80));
            NotificationLogger.logError(`Mise à jour des préférences pour ${event.userId}`, error);
        }
    }

    /**
     * Nettoie les notifications en attente pour un utilisateur
     */
    async cleanupPendingNotifications(userId) {
        try {
            console.log(`   🔍 Recherche des notifications en attente pour ${userId}...`);
            
            const pendingNotifications = await this.prisma.notificationHistory.findMany({
                where: {
                    userId: userId,
                    status: 'pending'
                }
            });
            
            if (pendingNotifications.length === 0) {
                console.log(`   ℹ️ Aucune notification en attente trouvée`);
                return;
            }
            
            console.log(`   📋 ${pendingNotifications.length} notifications en attente trouvées`);
            
            // Supprimer les notifications en attente
            const result = await this.prisma.notificationHistory.deleteMany({
                where: {
                    userId: userId,
                    status: 'pending'
                }
            });
            
            console.log(`   🗑️ ${result.count} notifications en attente supprimées`);
            console.log(`   ✅ Nettoyage terminé pour ${userId}`);
        } catch (error) {
            console.log(`   ❌ Erreur lors du nettoyage:`, error.message);
            NotificationLogger.logError(`Nettoyage des notifications pour ${userId}`, error);
        }
    }

    /**
     * Gestionnaire de suppression d'utilisateur
     */
    async handleUserDeleted(data) {
        console.log('\n' + '='.repeat(60));
        console.log('🗑️ ÉVÉNEMENT : SUPPRESSION D\'UTILISATEUR');
        console.log('='.repeat(60));
        console.log(`👤 Utilisateur supprimé: ${data.userId}`);
        await this.stopUserTasks(data.userId);
        console.log('✅ Toutes les tâches de cet utilisateur ont été supprimées');
        console.log('='.repeat(60));
    }

    /**
     * Gestionnaire de redémarrage du planificateur
     */
    async handleSchedulerRestart() {
        console.log('\n' + '='.repeat(60));
        console.log('🔄 ÉVÉNEMENT : REDÉMARRAGE DU PLANIFICATEUR');
        console.log('='.repeat(60));
        console.log('🛑 Arrêt en cours...');
        await this.stop();
        console.log('🚀 Redémarrage...');
        await this.start();
        console.log('✅ Redémarrage terminé');
        console.log('='.repeat(60));
    }

    /**
     * Arrête toutes les tâches d'un utilisateur spécifique
     */
    async stopUserTasks(userId) {
        const stopId = `STOP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`\n🚨🚨🚨 STOP_TASKS_${stopId}: ARRÊT DES TÂCHES DÉTECTÉ 🚨🚨🚨`);
        console.log(`⏰ Timestamp précis: ${new Date().toISOString()}`);
        console.log(`👤 UserId: ${userId}`);
        console.log(`📊 Jobs actuels AVANT arrêt: ${this.jobs.size}`);
        console.log(`📋 Clés actuelles: ${Array.from(this.jobs.keys()).join(', ')}`);
        console.log(`🔍 Stack trace: ${new Error().stack.split('\n').slice(1, 4).join(' -> ')}`);
        
        const userJobs = Array.from(this.jobs.keys()).filter(jobId => jobId.startsWith(`${userId}-`));
        console.log(`📊 Jobs utilisateur trouvés: ${userJobs.length} [${userJobs.join(', ')}]`);
        
        if (userJobs.length === 0) {
            console.log(`   ℹ️ Aucune tâche trouvée pour cet utilisateur`);
            return;
        }
        
        console.log(`   📋 ${userJobs.length} tâches trouvées:`);
        
        for (const jobId of userJobs) {
            const job = this.jobs.get(jobId);
            if (job) {
                job.stop();
                this.jobs.delete(jobId);
                console.log(`   ❌ Arrêtée: ${jobId}`);
            }
        }
        
        console.log(`   ✅ ${userJobs.length} tâches arrêtées pour l'utilisateur ${userId}`);
        
        // VÉRIFICATION POST-ARRÊT
        const remainingJobs = Array.from(this.jobs.keys()).filter(jobId => jobId.startsWith(`${userId}-`));
        console.log(`🔍 VÉRIFICATION POST-ARRÊT:`);
        console.log(`   📊 Jobs restants pour cet utilisateur: ${remainingJobs.length}`);
        console.log(`   📋 Jobs restants: [${remainingJobs.join(', ')}]`);
        console.log(`   📊 Total jobs après arrêt: ${this.jobs.size}`);
        
        if (remainingJobs.length > 0) {
            console.log(`🚨🚨🚨 ALERTE: JOBS NON ARRÊTÉS DÉTECTÉS! 🚨🚨🚨`);
            remainingJobs.forEach(jobId => {
                const job = this.jobs.get(jobId);
                console.log(`   ⚠️ Job fantôme: ${jobId} - État: ${job ? 'actif' : 'undefined'}`);
            });
        }
        console.log(`🚨🚨🚨 FIN STOP_TASKS_${stopId} 🚨🚨🚨\n`);
    }

    async start() {
        if (this.isStarted) {
            console.log('⚠️ Le planificateur est déjà démarré');
            return;
        }

        console.log('\n🚀 Démarrage du planificateur de notifications...');
        console.log('🎯 AVEC SYSTÈME DE MISE À JOUR TEMPS RÉEL ACTIVÉ');
        console.log('🌟 NOUVEAU: SYSTÈME RÉACTIF INTÉGRÉ');

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
                    console.log(`⚠️ Pas de préférences pour ${user.email}`);
                    continue;
                }

                const settings = user.notificationSettings;
                NotificationLogger.logNotificationSettings(settings);

                if (!settings.isEnabled) {
                    console.log(`❌ Notifications désactivées pour ${user.email}`);
                    continue;
                }

                // Planifier les notifications pour chaque utilisateur
                await this.scheduleUserNotifications(user.id, settings);
            }
            
            // Planifier le traitement des notifications
            this.scheduleNotificationProcessing();
            
            // Planifier le nettoyage des anciennes notifications
            this.scheduleCleanup();

            this.isStarted = true;
            
            // Démarrer le système réactif après la configuration de base
            console.log('\n🌟 Démarrage du système réactif avancé...');
            await this.reactiveManager.start();
            
            console.log('✅ Planificateur démarré avec succès');
            console.log('🎯 Prêt à recevoir les mises à jour de préférences en temps réel !');
            console.log('🌟 Système réactif opérationnel - détection automatique des changements !');
        }
        catch (error) {
            NotificationLogger.logError('Démarrage du planificateur', error);
            throw error;
        }
    }

    async scheduleUserNotifications(userId, settings) {
        try {
            console.log(`   📋 Configuration des notifications pour ${userId}:`);
            console.log(`      🔔 Activées: ${settings.isEnabled ? '✅' : '❌'}`);
            console.log(`      🌅 Matin: ${settings.morningTime}`);
            console.log(`      ☀️ Midi: ${settings.noonTime}`);
            console.log(`      🌤️ Après-midi: ${settings.afternoonTime}`);
            console.log(`      🌆 Soir: ${settings.eveningTime}`);
            console.log(`      🌙 Nuit: ${settings.nightTime}`);
            
            const { morningTime, noonTime, afternoonTime, eveningTime, nightTime } = settings;

            // Validation des horaires pour éviter les doublons
            const times = [morningTime, noonTime, afternoonTime, eveningTime, nightTime];
            const uniqueTimes = [...new Set(times)];
            
            if (times.length !== uniqueTimes.length) {
                console.log(`   ⚠️ ATTENTION: Horaires identiques détectés !`);
                console.log(`   📋 Horaires: ${times.join(', ')}`);
                console.log(`   🔄 Seuls les horaires uniques seront planifiés`);
            }

            // Vérifier si les horaires sont dans le futur proche (éviter cascade)
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            console.log(`   🕐 Heure actuelle: ${currentTime}`);
            
            const timesToSchedule = [];
            
            // Notification du matin
            if (settings.morningReminder && this.isValidSchedulingTime(morningTime, currentTime)) {
                timesToSchedule.push({time: morningTime, type: 'matin', callback: async (date) => await this.notificationService.scheduleMorningNotification(userId, date)});
            }

            // Notification du midi
            if (this.isValidSchedulingTime(noonTime, currentTime)) {
                timesToSchedule.push({time: noonTime, type: 'midi', callback: async (date) => await this.notificationService.scheduleNoonNotification(userId, date)});
            }

            // Notification de l'après-midi
            if (this.isValidSchedulingTime(afternoonTime, currentTime)) {
                timesToSchedule.push({time: afternoonTime, type: 'après-midi', callback: async (date) => await this.notificationService.scheduleAfternoonNotification(userId, date)});
            }

            // Notification du soir
            if (this.isValidSchedulingTime(eveningTime, currentTime)) {
                timesToSchedule.push({time: eveningTime, type: 'soir', callback: async (date) => await this.notificationService.scheduleEveningNotification(userId, date)});
            }

            // Notification de nuit
            if (this.isValidSchedulingTime(nightTime, currentTime)) {
                timesToSchedule.push({time: nightTime, type: 'nuit', callback: async (date) => await this.notificationService.scheduleNightNotification(userId, date)});
            }

            // Planifier seulement les horaires valides et uniques
            const uniqueTimesToSchedule = timesToSchedule.filter((item, index, self) => 
                index === self.findIndex(t => t.time === item.time)
            );

            console.log(`   📅 ${uniqueTimesToSchedule.length} horaires uniques seront planifiés`);

            for (const item of uniqueTimesToSchedule) {
                this.scheduleDailyNotification(userId, item.time, item.callback);
            }

            console.log(`   ✅ Toutes les notifications planifiées pour l'utilisateur ${userId}`);
        }
        catch (error) {
            console.log(`   ❌ Erreur lors de la planification pour ${userId}:`, error.message);
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

    scheduleDailyNotification(userId, time, callback) {
        const scheduleId = `SCHEDULE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const jobId = `${userId}-${time}`;
        
        console.log(`\n🚨🚨🚨 SCHEDULE_TASK_${scheduleId}: CRÉATION DE TÂCHE DÉTECTÉE 🚨🚨🚨`);
        console.log(`⏰ Timestamp précis: ${new Date().toISOString()}`);
        console.log(`👤 UserId: ${userId}`);
        console.log(`🕐 Time: ${time}`);
        console.log(`🆔 JobId: ${jobId}`);
        console.log(`📊 Jobs actuels AVANT création: ${this.jobs.size}`);
        console.log(`🔍 Job déjà existant? ${this.jobs.has(jobId) ? 'OUI ⚠️' : 'NON ✅'}`);
        console.log(`🔍 Stack trace: ${new Error().stack.split('\n').slice(1, 4).join(' -> ')}`);
        
        if (this.jobs.has(jobId)) {
            console.log(`🚨🚨🚨 ALERTE: TENTATIVE DE CRÉATION D'UN JOB DÉJÀ EXISTANT! 🚨🚨🚨`);
            console.log(`   🆔 Job existant: ${jobId}`);
            console.log(`   📊 Ceci pourrait causer des duplicatas!`);
        }
        
        const [hours, minutes] = time.split(':').map(Number);
        const cronExpression = `${minutes} ${hours} * * *`;

        if (!cron.validate(cronExpression)) {
            console.log(`   ❌ Expression cron invalide: ${cronExpression}`);
            NotificationLogger.logError('Validation de l\'expression cron', new Error(`Expression cron invalide : ${cronExpression}`));
            return;
        }

        const job = cron.schedule(cronExpression, async () => {
            const execId = `EXEC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`\n🔥🔥🔥 CRON_EXECUTION_${execId}: TÂCHE CRON DÉCLENCHÉE 🔥🔥🔥`);
            console.log(`⏰ Timestamp précis: ${new Date().toISOString()}`);
            console.log(`🆔 JobId: ${jobId}`);
            console.log(`👤 UserId: ${userId}`);
            console.log(`🕐 Time: ${time}`);
            console.log(`📊 Jobs actifs actuels: ${this.jobs.size}`);
            try {
                const now = new Date();
                console.log(`🔄 Appel du callback pour ${jobId}...`);
                await callback(now);
                console.log(`✅ Callback terminé pour ${jobId}`);
            }
            catch (error) {
                console.log(`❌ Erreur dans callback pour ${jobId}:`, error.message);
                NotificationLogger.logError('Exécution de la tâche planifiée', error);
            }
            console.log(`🔥🔥🔥 FIN CRON_EXECUTION_${execId} 🔥🔥🔥\n`);
        });

        this.jobs.set(jobId, job);
        console.log(`   ➕ Nouvelle tâche: ${jobId} (${cronExpression})`);
        console.log(`📊 Jobs actuels APRÈS création: ${this.jobs.size}`);
        console.log(`🔍 Job bien créé? ${this.jobs.has(jobId) ? 'OUI ✅' : 'NON ❌'}`);
        console.log(`🚨🚨🚨 FIN SCHEDULE_TASK_${scheduleId} 🚨🚨🚨\n`);
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
        console.log('🔄 Tâche de traitement des notifications planifiée (toutes les minutes)');
    }

    async processNotifications() {
        const batchId = Math.random().toString(36).substring(7);
        console.log(`🟢 [${batchId}] processNotifications() APPELÉ - PID: ${process.pid} - ${new Date().toISOString()}`);
        
        try {
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            const twoMinutesInFuture = new Date(now.getTime() + 2 * 60 * 1000);

            // Récupérer les notifications en attente qui doivent être envoyées
            console.log(`🟢 [${batchId}] Récupération des notifications entre ${fiveMinutesAgo.toISOString()} et ${twoMinutesInFuture.toISOString()}`);
            const pendingNotifications = await this.prisma.notificationHistory.findMany({
                where: {
                    status: 'pending',
                    scheduledFor: {
                        gte: fiveMinutesAgo,
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

            console.log(`🟢 [${batchId}] Notifications récupérées: ${pendingNotifications.length}`);
            
            if (pendingNotifications.length > 0) {
                console.log(`🔄 [${batchId}] Traitement de ${pendingNotifications.length} notifications...`);
                
                for (const notification of pendingNotifications) {
                    try {
                        console.log(`🟢 [${batchId}] Traitement notification ${notification.id}`);
                        await this.notificationService.processNotification(notification);
                    }
                    catch (error) {
                        NotificationLogger.logError(`Traitement de la notification ${notification.id}`, error);
                    }
                }
                
                console.log(`✅ [${batchId}] Batch terminé - ${pendingNotifications.length} notifications traitées`);
            } else {
                console.log(`🟢 [${batchId}] Aucune notification à traiter`);
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
                console.log(`🧹 Nettoyage des notifications :`);
                console.log(`   ${result.count} notifications supprimées`);
            }
            catch (error) {
                NotificationLogger.logError('Nettoyage des notifications', error);
            }
        });
        this.jobs.set('cleanup', job);
        console.log('🧹 Tâche de nettoyage planifiée');
    }

    stop() {
        console.log('\n🛑 Arrêt du planificateur...');
        
        // Arrêter le système réactif d'abord
        if (this.reactiveManager) {
            console.log('🌟 Arrêt du système réactif...');
            this.reactiveManager.stop();
        }
        
        this.jobs.forEach((job, id) => {
            job.stop();
            console.log(`   Tâche arrêtée : ${id}`);
        });
        this.jobs.clear();
        this.isStarted = false;
        console.log('✅ Planificateur arrêté\n');
    }

    /**
     * Met à jour le planning d'un utilisateur spécifique
     */
    async updateUserSchedule(userId) {
        try {
            console.log(`🔄 Mise à jour du planning pour l'utilisateur ${userId}`);
            
            // Récupérer les nouvelles préférences
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { notificationSettings: true }
            });
            
            if (!user || !user.notificationSettings) {
                console.log(`⚠️ Utilisateur ou préférences non trouvés pour ${userId}`);
                return;
            }
            
            // Arrêter les anciennes tâches
            await this.stopUserTasks(userId);
            
            // Replanifier si activé
            if (user.notificationSettings.isEnabled) {
                await this.scheduleUserNotifications(userId, user.notificationSettings);
                console.log(`✅ Planning mis à jour pour ${userId}`);
            } else {
                console.log(`❌ Notifications désactivées pour ${userId}`);
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
            realtimeUpdates: true,
            eventListeners: true,
            reactiveSystem: this.reactiveManager ? this.reactiveManager.getSystemStatus() : null,
            jobs: Array.from(this.jobs.keys())
        };
    }

    scheduleNotificationsForUser(user) {
        const scheduleStart = Date.now();
        const scheduleId = uuidv4();
        
        NotificationLogger.log('INFO', 'SCHEDULE_USER_START', {
            scheduleId,
            schedulerId: this.schedulerId,
            userId: user.id,
            userEmail: user.email,
            hasSettings: !!user.notificationSettings,
            scheduleStart
        });

        if (!user.notificationSettings?.isEnabled) {
            NotificationLogger.log('WARN', 'SCHEDULE_USER_DISABLED', {
                scheduleId,
                userId: user.id,
                reason: 'notifications_disabled'
            });
            return;
        }

        const settings = user.notificationSettings;
        const times = [
            { type: 'MORNING_REMINDER', time: settings.morningTime },
            { type: 'NOON_CHECK', time: settings.noonTime },
            { type: 'AFTERNOON_REMINDER', time: settings.afternoonTime },
            { type: 'EVENING_PLANNING', time: settings.eveningTime },
            { type: 'NIGHT_HABITS_CHECK', time: settings.nightTime }
        ];

        let scheduledJobs = 0;
        let skippedJobs = 0;

        times.forEach(({ type, time }) => {
            const jobId = `${user.id}-${time}`;
            const jobStart = Date.now();
            
            NotificationLogger.log('DEBUG', 'SCHEDULE_JOB_START', {
                scheduleId,
                jobId,
                type,
                time,
                userId: user.id,
                jobStart
            });

            try {
                // Vérifier si le job existe déjà
                if (this.jobs.has(jobId)) {
                    NotificationLogger.log('WARN', 'SCHEDULE_JOB_EXISTS', {
                        scheduleId,
                        jobId,
                        type,
                        action: 'skipping'
                    });
                    skippedJobs++;
                    return;
                }

                const [hour, minute] = time.split(':').map(Number);
                const cronExpression = `${minute} ${hour} * * *`;

                const job = cron.schedule(cronExpression, async () => {
                    const jobExecutionId = uuidv4();
                    const executionStart = Date.now();
                    
                    NotificationLogger.logSchedulerJobStart({
                        jobId: jobExecutionId,
                        jobType: type,
                        userId: user.id,
                        scheduledTime: `${hour}:${minute}`,
                        actualTime: new Date().toISOString(),
                        delay: this.calculateDelay(hour, minute)
                    });

                    try {
                        await this.processScheduledNotification(user.id, type, jobExecutionId);
                        
                        NotificationLogger.logSchedulerJobEnd({
                            jobId: jobExecutionId,
                            success: true,
                            duration: Date.now() - executionStart,
                            notificationsProcessed: 1
                        });
                    } catch (error) {
                        NotificationLogger.logSchedulerJobEnd({
                            jobId: jobExecutionId,
                            success: false,
                            duration: Date.now() - executionStart,
                            error: error.message
                        });
                    }
                }, {
                    scheduled: false,
                    timezone: 'Europe/Paris'
                });

                job.start();
                this.jobs.set(jobId, {
                    job,
                    type,
                    userId: user.id,
                    time,
                    cronExpression,
                    createdAt: new Date(),
                    executionCount: 0
                });

                const jobDuration = Date.now() - jobStart;
                scheduledJobs++;

                NotificationLogger.log('SUCCESS', 'SCHEDULE_JOB_CREATED', {
                    scheduleId,
                    jobId,
                    type,
                    cronExpression,
                    jobDuration,
                    totalJobs: this.jobs.size
                });

            } catch (error) {
                NotificationLogger.log('ERROR', 'SCHEDULE_JOB_ERROR', {
                    scheduleId,
                    jobId,
                    type,
                    error: error.message,
                    stack: error.stack
                });
            }
        });

        const scheduleDuration = Date.now() - scheduleStart;
        
        NotificationLogger.log('SUCCESS', 'SCHEDULE_USER_COMPLETE', {
            scheduleId,
            userId: user.id,
            scheduledJobs,
            skippedJobs,
            totalJobs: this.jobs.size,
            scheduleDuration
        });
    }

    async processScheduledNotification(userId, type, jobExecutionId) {
        const processStart = Date.now();
        
        NotificationLogger.log('INFO', 'PROCESS_NOTIFICATION_START', {
            jobExecutionId,
            userId,
            type,
            processStart,
            schedulerId: this.schedulerId
        });

        try {
            // Vérification de concurrence
            const concurrencyCheck = await this.checkConcurrency(userId, type);
            if (concurrencyCheck.hasConflict) {
                NotificationLogger.logConcurrencyEvent({
                    event: 'CONCURRENT_PROCESSING_DETECTED',
                    userId,
                    conflictType: type,
                    existingJob: concurrencyCheck.existingJob
                });
                return;
            }

            // Marquer comme en cours de traitement
            await this.markProcessingStart(userId, type, jobExecutionId);

            const user = await this.getUserWithSettings(userId);
            if (!user) {
                NotificationLogger.log('ERROR', 'USER_NOT_FOUND', {
                    jobExecutionId,
                    userId
                });
                return;
            }

            const notificationData = await this.createNotificationData(user, type, jobExecutionId);
            const notification = await NotificationService.createNotification(
                userId,
                type,
                notificationData.content,
                notificationData.scheduledFor
            );

            if (!notification) {
                NotificationLogger.log('WARN', 'NOTIFICATION_NOT_CREATED', {
                    jobExecutionId,
                    userId,
                    type,
                    reason: 'duplicate_or_error'
                });
                return;
            }

            await this.processNotification(notification, jobExecutionId);

            const processDuration = Date.now() - processStart;
            NotificationLogger.log('SUCCESS', 'PROCESS_NOTIFICATION_COMPLETE', {
                jobExecutionId,
                notificationId: notification.id,
                processDuration
            });

        } catch (error) {
            const processDuration = Date.now() - processStart;
            NotificationLogger.log('ERROR', 'PROCESS_NOTIFICATION_ERROR', {
                jobExecutionId,
                userId,
                type,
                error: error.message,
                stack: error.stack,
                processDuration
            });
        } finally {
            await this.markProcessingEnd(userId, type, jobExecutionId);
        }
    }

    calculateDelay(scheduledHour, scheduledMinute) {
        const now = new Date();
        const scheduled = new Date();
        scheduled.setHours(scheduledHour, scheduledMinute, 0, 0);
        
        if (scheduled < now) {
            scheduled.setDate(scheduled.getDate() + 1);
        }
        
        return scheduled.getTime() - now.getTime();
    }

    async checkConcurrency(userId, type) {
        // Implémentation simple de détection de concurrence
        const key = `${userId}-${type}`;
        const now = Date.now();
        
        if (this.processingJobs && this.processingJobs.has(key)) {
            const existingJob = this.processingJobs.get(key);
            const age = now - existingJob.startTime;
            
            if (age < 30000) { // 30 secondes de timeout
                return {
                    hasConflict: true,
                    existingJob: existingJob
                };
            } else {
                // Job trop vieux, probablement bloqué
                this.processingJobs.delete(key);
            }
        }
        
        return { hasConflict: false };
    }

    async markProcessingStart(userId, type, jobExecutionId) {
        if (!this.processingJobs) {
            this.processingJobs = new Map();
        }
        
        const key = `${userId}-${type}`;
        this.processingJobs.set(key, {
            jobExecutionId,
            startTime: Date.now(),
            userId,
            type
        });
        
        NotificationLogger.log('DEBUG', 'PROCESSING_MARKED_START', {
            key,
            jobExecutionId,
            activeProcessingJobs: this.processingJobs.size
        });
    }

    async markProcessingEnd(userId, type, jobExecutionId) {
        if (!this.processingJobs) return;
        
        const key = `${userId}-${type}`;
        const existing = this.processingJobs.get(key);
        
        if (existing && existing.jobExecutionId === jobExecutionId) {
            this.processingJobs.delete(key);
            
            NotificationLogger.log('DEBUG', 'PROCESSING_MARKED_END', {
                key,
                jobExecutionId,
                duration: Date.now() - existing.startTime,
                activeProcessingJobs: this.processingJobs.size
            });
        }
    }

    async processNotification(notification, jobExecutionId) {
        // Implementation of processNotification method
    }

    async createNotificationData(user, type, jobExecutionId) {
        // Implementation of createNotificationData method
    }

    async getUserWithSettings(userId) {
        // Implementation of getUserWithSettings method
    }
}

export default NotificationScheduler;
