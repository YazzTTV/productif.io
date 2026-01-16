import { PrismaClient } from '@prisma/client';
import WhatsAppService from './whatsappService.js';
import NotificationLogger from './NotificationLogger.js';
import NotificationContentBuilder from './NotificationContentBuilder.js';
import { getNotificationTitle } from './notification-titles.js';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

class NotificationService {
    constructor() {
        this.prisma = new PrismaClient();
        this.whatsappService = WhatsAppService;
    }
    async processNotifications() {
        try {
            const now = new Date();
            // Arrondir à la minute
            now.setSeconds(0, 0);
            const oneMinuteFromNow = new Date(now);
            oneMinuteFromNow.setMinutes(now.getMinutes() + 1);
            const notifications = await this.prisma.notificationHistory.findMany({
                where: {
                    status: 'pending',
                    scheduledFor: {
                        gte: now,
                        lt: oneMinuteFromNow
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
            console.log(`🔄 Traitement de ${notifications.length} notifications...`);
            for (const notification of notifications) {
                try {
                    await this.processNotification(notification);
                }
                catch (error) {
                    NotificationLogger.logError(`Traitement de la notification ${notification.id}`, error);
                }
            }
        }
        catch (error) {
            NotificationLogger.logError('Traitement des notifications', error);
        }
    }
    async processNotification(notification) {
        const processingId = Math.random().toString(36).substring(7);
        console.log(`🔵 [${processingId}] DÉBUT processNotification pour notification ${notification.id} - PID: ${process.pid}`);
        NotificationLogger.logNotificationProcessing(notification);
        try {
            const now = new Date();
            
            // 🛡️ PROTECTION ANTI-DOUBLON : Marquer immédiatement comme 'processing' avec vérification atomique
            console.log(`🔵 [${processingId}] Tentative de claim pour notification ${notification.id}`);
            const claimed = await this.prisma.notificationHistory.updateMany({
                where: {
                    id: notification.id,
                    status: 'pending' // Ne mettre à jour QUE si encore 'pending'
                },
                data: {
                    status: 'processing'
                }
            });

            console.log(`🔵 [${processingId}] Claim result: ${claimed.count} ligne(s) mises à jour`);
            
            // Si aucune ligne mise à jour, la notification a déjà été traitée par un autre processus
            if (claimed.count === 0) {
                console.log(`⚠️ [${processingId}] Notification ${notification.id} déjà en cours de traitement, ignorée`);
                return;
            }

            // Vérifier si l'utilisateur accepte les notifications à cette heure
            if (!this.canSendNotification(notification.user.notificationSettings, now)) {
                console.log(`⏳ Notification reportée :`);
                console.log(`  - Raison: Hors plage horaire`);
                console.log(`  - Heure actuelle: ${now.getHours()}h${now.getMinutes()}`);
                console.log(`  - Plage autorisée: ${notification.user.notificationSettings.startHour}h-${notification.user.notificationSettings.endHour}h`);
                
                // Remettre en pending pour traitement ultérieur
                await this.prisma.notificationHistory.update({
                    where: { id: notification.id },
                    data: { status: 'pending' }
                });
                return;
            }
            
            // Vérifier les canaux de notification disponibles
            const settings = notification.user.notificationSettings;
            const userPhoneNumber = notification.user.whatsappNumber || settings?.whatsappNumber;
            const canSendWhatsapp = settings?.whatsappEnabled && !!userPhoneNumber;
            const canSendPush = !!settings?.pushEnabled;

            if (!canSendWhatsapp && !canSendPush) {
                NotificationLogger.logError('Configuration notification', new Error('Aucun canal disponible pour l\'utilisateur'));
                await this.prisma.notificationHistory.update({
                    where: { id: notification.id },
                    data: {
                        status: 'failed',
                        error: 'Aucun canal disponible'
                    }
                });
                return;
            }
            
            if (canSendWhatsapp) {
                // Système de templates désactivé - tous les messages sont envoyés en texte normal
                console.log(`🔵 [${processingId}] Envoi WhatsApp pour notification ${notification.id} (type: ${notification.type}, mode: texte normal)`);
                
                // Formater le message avec titre
                const messageContent = this.formatWhatsAppMessage(notification);
                
                // Envoyer sans template
                await this.whatsappService.sendMessage(userPhoneNumber, messageContent, notification.id, null);
                console.log(`🔵 [${processingId}] WhatsApp envoyé avec succès pour notification ${notification.id}`);
            }
            
            // Envoyer aussi une notification push si activée
            if (canSendPush) {
                try {
                    const { sendPushNotification } = await import('../../lib/apns.js');
                    // Utiliser les titres/corps courts si disponibles pour le push,
                    // sinon fallback sur le titre générique + extrait du contenu
                    const title = notification.pushTitle || getNotificationTitle(notification.type);
                    const body = notification.pushBody || this.extractBodyFromContent(notification.content);
                    
                    // Déterminer l'action selon le type de notification
                    let action = 'open_assistant';
                    let checkInType = null;
                    
                    // Pour les notifications mood/stress/focus premium, rediriger vers Analytics
                    if (notification.type === 'MOOD_CHECK_PREMIUM') {
                        action = 'open_analytics';
                        checkInType = 'mood';
                    } else if (notification.type === 'STRESS_CHECK_PREMIUM') {
                        action = 'open_analytics';
                        checkInType = 'stress';
                    } else if (notification.type === 'FOCUS_CHECK_PREMIUM') {
                        action = 'open_analytics';
                        checkInType = 'focus';
                    }
                    
                    const pushData = {
                        notificationId: notification.id,
                        type: notification.type,
                        action: action,
                        // Message complet destiné à préremplir l'assistant IA mobile (pour les autres notifications)
                        message: notification.assistantMessage || notification.content,
                        // Type de check-in pour les notifications mood/stress/focus
                        checkInType: checkInType
                    };
                    
                    console.log(`📤 [${processingId}] Payload push APNs envoyé:`, {
                        userId: notification.userId,
                        title,
                        body,
                        data: pushData,
                        hasAssistantMessage: !!notification.assistantMessage,
                        messageLength: pushData.message?.length || 0
                    });
                    
                    const pushResult = await sendPushNotification(notification.userId, {
                        title: title,
                        body: body,
                        sound: 'default',
                        data: pushData
                    });
                    
                    if (pushResult.success && pushResult.sent > 0) {
                        console.log(`📱 [${processingId}] Notification push envoyée avec succès (${pushResult.sent} appareil(s))`);
                    } else if (pushResult.failed > 0) {
                        console.log(`⚠️ [${processingId}] Notification push partiellement échouée (${pushResult.failed} échec(s))`);
                    }
                } catch (pushError) {
                    console.error(`❌ [${processingId}] Erreur lors de l'envoi de la notification push:`, pushError);
                    // On continue même si la push échoue, WhatsApp est déjà envoyé
                }
            }
            
            // Marquer comme envoyée
            await this.prisma.notificationHistory.update({
                where: { id: notification.id },
                data: {
                    status: 'sent',
                    sentAt: now
                }
            });
            
            console.log(`✅ [${processingId}] Notification ${notification.id} envoyée avec succès`);
            console.log(`  - Heure d'envoi: ${now.toLocaleTimeString()}`);
        }
        catch (error) {
            NotificationLogger.logError('Traitement de notification', error);
            // Vérifier si la notification existe toujours
            const existingNotification = await this.prisma.notificationHistory.findUnique({
                where: { id: notification.id }
            });
            if (existingNotification) {
                // Marquer comme échouée
                await this.prisma.notificationHistory.update({
                    where: { id: notification.id },
                    data: {
                        status: 'failed',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
            throw error;
        }
    }
    canSendNotification(settings, date) {
        if (!settings)
            return false;
        const hour = date.getHours();

        const start = Math.max(0, Math.min(23, Number(settings.startHour ?? 0)));
        let end = Number(settings.endHour ?? 24);
        if (end === 0) end = 24;
        end = Math.max(1, Math.min(24, end));

        if (start < end) {
            return hour >= start && hour < end; // [start, end)
        } else if (start > end) {
            return hour >= start || hour < end; // wrap minuit
        } else {
            return start === 0; // 0->0 : 24/24
        }
    }
    extractBodyFromContent(content) {
        if (!content) return '';
        // Retirer les emojis et formater pour notification push
        let body = content.replace(/\n+/g, ' ').trim();
        // Limiter à 200 caractères pour les notifications push
        if (body.length > 200) {
            body = body.substring(0, 197) + '...';
        }
        return body;
    }
    formatWhatsAppMessage(notification) {
        const title = getNotificationTitle(notification.type);
        let message = '';
        
        // Si le contenu commence déjà par le titre, ne pas le dupliquer
        if (notification.content && notification.content.startsWith(title)) {
            message = notification.content;
        } else {
            message = `${title}\n\n`;
            message += notification.content;
        }
        
        message += '\n\n_Envoyé via Productif.io_';
        return message;
    }
    getDayRange(date = new Date()) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }
    async hasNotificationToday(userId, type) {
        const { start, end } = this.getDayRange(new Date());
        const count = await this.prisma.notificationHistory.count({
            where: {
                userId,
                type,
                scheduledFor: {
                    gte: start,
                    lte: end
                }
            }
        });
        return count > 0;
    }
    async getTasksBetween(userId, start, end) {
        return this.prisma.task.findMany({
            where: {
                userId,
                completed: false,
                OR: [
                    { scheduledFor: { gte: start, lte: end } },
                    { dueDate: { gte: start, lte: end } }
                ]
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' }
            ],
            take: 5
        });
    }
    async getRecentActivityMinutes(userId, since) {
        const entries = await this.prisma.timeEntry.findMany({
            where: {
                userId,
                startTime: { gte: since }
            },
            select: { startTime: true, endTime: true }
        });
        let minutes = 0;
        for (const entry of entries) {
            const end = entry.endTime || new Date();
            minutes += Math.max(0, Math.floor((end.getTime() - entry.startTime.getTime()) / 60000));
        }
        return minutes;
    }
    async getBusyPeriods(userId, start, end) {
        const events = await this.prisma.scheduledTaskEvent.findMany({
            where: {
                userId,
                startTime: { lte: end },
                endTime: { gte: start }
            },
            select: { startTime: true, endTime: true }
        });
        const periods = events.map(e => ({ start: e.startTime, end: e.endTime }));
        return periods.sort((a, b) => a.start.getTime() - b.start.getTime());
    }
    findFirstFreeBlock(busyPeriods, windowStart, windowEnd, minMinutes) {
        let cursor = new Date(windowStart);
        const sorted = [...busyPeriods].sort((a, b) => a.start.getTime() - b.start.getTime());
        for (const busy of sorted) {
            if (busy.end <= cursor) {
                continue;
            }
            if (busy.start > cursor) {
                const diff = (busy.start.getTime() - cursor.getTime()) / 60000;
                if (diff >= minMinutes) {
                    return { start: new Date(cursor), end: new Date(busy.start), durationMinutes: Math.floor(diff) };
                }
            }
            if (busy.end > cursor) {
                cursor = new Date(Math.min(busy.end.getTime(), windowEnd.getTime()));
            }
            if (cursor >= windowEnd) break;
        }
        if (cursor < windowEnd) {
            const diff = (windowEnd.getTime() - cursor.getTime()) / 60000;
            if (diff >= minMinutes) {
                return { start: new Date(cursor), end: new Date(windowEnd), durationMinutes: Math.floor(diff) };
            }
        }
        return null;
    }
    async createNotification(userId, type, content, scheduledFor, options = {}) {
        const { pushTitle = null, pushBody = null, assistantMessage = null } = options || {};
        const notificationId = uuidv4();
        
        NotificationLogger.logNotificationCreation({
            notificationId,
            userId,
            type,
            scheduledFor: scheduledFor.toISOString()
        });

        try {
            const notification = await this.prisma.notificationHistory.create({
                data: {
                    userId,
                    type,
                    content,
                    pushTitle,
                    pushBody,
                    assistantMessage,
                    scheduledFor,
                    status: 'pending'
                }
            });

            NotificationLogger.logNotificationCreated({
                notificationId,
                dbId: notification.id,
                status: notification.status
            });

            return notification;

        } catch (error) {
            NotificationLogger.logNotificationError({
                notificationId,
                error: error.message,
                stack: error.stack
            });
            
            throw error;
        }
    }
    async scheduleNotification(userId, type, content, scheduledFor, options = {}) {
        try {
            // Récupérer les préférences de l'utilisateur
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    notificationSettings: true
                }
            });
            if (!user) {
                throw new Error(`Utilisateur ${userId} non trouvé`);
            }
            NotificationLogger.logNotificationSettings(user.notificationSettings);
            // Vérifier si la notification peut être envoyée à cette heure
            if (!this.canSendNotification(user.notificationSettings, scheduledFor)) {
                console.log(`⚠️ La notification ne peut pas être envoyée à cette heure`);
                return null;
            }
            const { pushTitle = null, pushBody = null, assistantMessage = null } = options || {};
            const notification = await this.prisma.notificationHistory.create({
                data: {
                    userId,
                    type,
                    content,
                    pushTitle,
                    pushBody,
                    assistantMessage,
                    scheduledFor,
                    status: 'pending'
                }
            });
            NotificationLogger.logNotificationCreation(notification);
            return notification;
        }
        catch (error) {
            NotificationLogger.logError('Planification de notification', error);
            throw error;
        }
    }
    async retryFailedNotifications() {
        try {
            // Récupérer les notifications échouées
            const failedNotifications = await this.prisma.notificationHistory.findMany({
                where: {
                    status: 'failed',
                    scheduledFor: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
                    }
                }
            });
            for (const notification of failedNotifications) {
                try {
                    // Réessayer d'envoyer la notification
                    await this.processNotification(notification);
                }
                catch (error) {
                    console.error(`Erreur lors de la nouvelle tentative pour la notification ${notification.id}:`, error);
                }
            }
        }
        catch (error) {
            console.error('Erreur lors de la reprise des notifications échouées:', error);
            throw error;
        }
    }
    async scheduleDailyMotivation(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    notificationSettings: true
                }
            });
            if (!user || !user.notificationSettings?.motivation) {
                return;
            }
            const motivationalMessages = [
                "Une nouvelle journée commence ! Quels objectifs allez-vous atteindre aujourd'hui ?",
                "Chaque petit pas compte. Concentrez-vous sur vos priorités !",
                "N'oubliez pas de célébrer vos victoires, même les plus petites !",
                "Vous avez le pouvoir de rendre cette journée productive et enrichissante.",
                "Rappelez-vous pourquoi vous avez commencé. Gardez le cap !"
            ];
            const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
            const scheduledTime = new Date();
            scheduledTime.setHours(parseInt(user.notificationSettings.morningTime.split(':')[0]));
            scheduledTime.setMinutes(parseInt(user.notificationSettings.morningTime.split(':')[1]));
            await this.prisma.notificationHistory.create({
                data: {
                    userId: user.id,
                    type: 'DAILY_MOTIVATION',
                    content: message,
                    scheduledFor: scheduledTime,
                    status: 'pending'
                }
            });
        }
        catch (error) {
            console.error('Erreur lors de la planification de la motivation quotidienne:', error);
            throw error;
        }
    }
    async scheduleMorningNotification(userId, date) {
        try {
            // Message complet utilisé pour WhatsApp + assistant IA
            const content = await NotificationContentBuilder.buildMorningContent(userId);

            // Version courte pour la push
            const shortTitle = '☀️ Nouvelle journée';
            const shortBody = "Quelle est la seule chose importante aujourd'hui ?";

            await this.createNotification(
              userId,
              'MORNING_REMINDER',
              content,
              date,
              {
                pushTitle: shortTitle,
                pushBody: shortBody,
                assistantMessage: content,
              }
            );
        }
        catch (error) {
            NotificationLogger.logError('Planification de la notification du matin', error);
        }
    }
    async scheduleNoonNotification(userId, date) {
        try {
            // Message complet utilisé pour WhatsApp + assistant IA
            const content = await NotificationContentBuilder.buildNoonContent(userId);

            // Version courte pour la push
            const shortTitle = '🍽️ Pause méritée';
            const shortBody = 'Prends le temps de manger. Le repos fait partie de la performance.';

            await this.createNotification(
              userId,
              'NOON_CHECK',
              content,
              date,
              {
                pushTitle: shortTitle,
                pushBody: shortBody,
                assistantMessage: content,
              }
            );
        }
        catch (error) {
            NotificationLogger.logError('Planification de la notification du midi', error);
        }
    }
    async scheduleAfternoonNotification(userId, date) {
        try {
            // Message complet utilisé pour WhatsApp + assistant IA
            const content = await NotificationContentBuilder.buildAfternoonContent(userId);

            // Version courte pour la push (titre + préview)
            const shortTitle = '🌤️ L’après-midi commence';
            const shortBody = 'Reviens calmement à l’essentiel.';

            await this.createNotification(
              userId,
              'AFTERNOON_REMINDER',
              content,
              date,
              {
                pushTitle: shortTitle,
                pushBody: shortBody,
                // Message complet qui sera envoyé au mobile pour préremplir l’assistant
                assistantMessage: content,
              }
            );
        }
        catch (error) {
            NotificationLogger.logError('Planification de la notification de l\'après-midi', error);
        }
    }
    async scheduleEveningNotification(userId, date) {
        try {
            // Message complet utilisé pour WhatsApp + assistant IA
            const content = await NotificationContentBuilder.buildEveningContent(userId);

            // Version courte pour la push
            const shortTitle = '🌙 Préparer demain';
            const shortBody = 'Une intention suffit pour bien démarrer.';

            await this.createNotification(
              userId,
              'EVENING_PLANNING',
              content,
              date,
              {
                pushTitle: shortTitle,
                pushBody: shortBody,
                assistantMessage: content,
              }
            );
        }
        catch (error) {
            NotificationLogger.logError('Planification de la notification du soir', error);
        }
    }
    async scheduleNightNotification(userId, date) {
        try {
            // Message complet utilisé pour WhatsApp + assistant IA
            const content = await NotificationContentBuilder.buildNightContent(userId);

            // Version courte pour la push
            const shortTitle = '🌃 Bilan du soir';
            const shortBody = "Comment s'est passée ta journée ?";

            await this.createNotification(
              userId,
              'NIGHT_HABITS_CHECK',
              content,
              date,
              {
                pushTitle: shortTitle,
                pushBody: shortBody,
                assistantMessage: content,
              }
            );
        }
        catch (error) {
            NotificationLogger.logError('Planification de la notification de nuit', error);
        }
    }

    async scheduleImprovementNotification(userId, date) {
        try {
            // Message complet utilisé pour WhatsApp + assistant IA
            const content = "🎯 Aujourd'hui, concentre-toi sur une amélioration clé.\n\n💡 Idées :\n1) Choisis une difficulté et écris une action concrète pour la réduire.\n2) Bloque 25 min en deep work sur une tâche prioritaire.\n3) Supprime une distraction majeure (notifications, onglets...).\n\n🚀 Un pas à la fois !";

            // Version courte pour la push
            const shortTitle = '📈 Amélioration';
            const shortBody = "Quelle est la petite victoire d'aujourd'hui, même minime ?";

            await this.createNotification(
              userId,
              'IMPROVEMENT_REMINDER',
              content,
              date,
              {
                pushTitle: shortTitle,
                pushBody: shortBody,
                assistantMessage: content,
              }
            );
        } catch (error) {
            NotificationLogger.logError('Planification de la notification amélioration', error);
        }
    }

    async scheduleRecapNotification(userId, date) {
        try {
            // Message complet utilisé pour WhatsApp + assistant IA
            const content = "✨ Bilan de ta journée\n\n✅ Liste tes accomplissements\n⏱ Note ton temps de travail\n💭 Comment s'est passée ta journée ?\n\nPrends 2 minutes pour le récap, puis prépare demain. 💪";

            // Version courte pour la push
            const shortTitle = '📊 Récap';
            const shortBody = "Regarde le chemin parcouru aujourd'hui. Es-tu fier de toi ?";

            await this.createNotification(
              userId,
              'RECAP_ANALYSIS',
              content,
              date,
              {
                pushTitle: shortTitle,
                pushBody: shortBody,
                assistantMessage: content,
              }
            );
        } catch (error) {
            NotificationLogger.logError('Planification de la notification récap', error);
        }
    }

    // Les fonctions basiques (MOOD_CHECK, STRESS_CHECK, FOCUS_CHECK) ont été supprimées
    // Seules les versions Premium existent maintenant

    async scheduleMorningAnchor(userId, date) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { notificationSettings: true }
            });
            if (!user?.notificationSettings?.isEnabled) return;
            if (!this.canSendNotification(user.notificationSettings, date)) return;

            const { start, end } = this.getDayRange(date);
            const tasks = await this.getTasksBetween(userId, start, end);
            const busy = await this.getBusyPeriods(userId, start, end);
            const activeMinutes = await this.getRecentActivityMinutes(userId, new Date(date.getTime() - 3 * 24 * 60 * 60 * 1000));

            if (tasks.length === 0 && busy.length === 0) return;
            if (activeMinutes < 30) return;

            const topTasks = tasks.slice(0, 3).map(t => `• ${t.title}`).join('\n');
            const agendaLine = busy.length > 0 ? 'Cours/événements trouvés dans ton calendrier.' : '';
            const contentParts = [
                "Ta journée est prête.",
                agendaLine,
                tasks.length ? "Plan du jour :" : '',
                topTasks,
                "Commence par le premier bloc."
            ].filter(Boolean);
            const content = contentParts.join('\n\n');

            await this.createNotification(userId, 'MORNING_ANCHOR', content, date, {
                pushTitle: '🌅 Ta journée est prête',
                pushBody: 'Ta journée est planifiée. Commence par le premier bloc.',
                assistantMessage: content
            });
        } catch (error) {
            NotificationLogger.logError('Planification Morning Anchor', error);
        }
    }

    async scheduleFocusWindow(userId) {
        try {
            const now = new Date();
            console.log(`\n🎯 [FOCUS_WINDOW] Analyse pour user ${userId} à ${now.toISOString()}`);
            
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { notificationSettings: true }
            });
            
            if (!user?.notificationSettings?.isEnabled) {
                console.log(`   ⏭️  [FOCUS_WINDOW] Ignoré: notifications désactivées`);
                return { skipped: true, reason: 'notifications_disabled' };
            }
            
            if (!this.canSendNotification(user.notificationSettings, now)) {
                console.log(`   ⏭️  [FOCUS_WINDOW] Ignoré: hors des horaires autorisés`);
                return { skipped: true, reason: 'outside_allowed_hours' };
            }

            const activeSession = await this.prisma.deepWorkSession.findFirst({
                where: { userId, status: 'active' }
            });
            if (activeSession) {
                console.log(`   ⏭️  [FOCUS_WINDOW] Ignoré: session deep work active (${activeSession.id})`);
                return { skipped: true, reason: 'active_deep_work_session' };
            }
            
            if (await this.hasNotificationToday(userId, 'FOCUS_WINDOW')) {
                console.log(`   ⏭️  [FOCUS_WINDOW] Ignoré: notification déjà envoyée aujourd'hui`);
                return { skipped: true, reason: 'already_sent_today' };
            }

            const { start, end } = this.getDayRange(now);
            const tasks = await this.getTasksBetween(userId, start, end);
            console.log(`   📋 [FOCUS_WINDOW] Tâches trouvées: ${tasks.length}`);
            if (!tasks.length) {
                console.log(`   ⏭️  [FOCUS_WINDOW] Ignoré: aucune tâche planifiée`);
                return { skipped: true, reason: 'no_tasks' };
            }

            const busy = await this.getBusyPeriods(userId, start, end);
            console.log(`   📅 [FOCUS_WINDOW] Périodes occupées: ${busy.length}`);
            
            const windowStart = new Date(now);
            const windowEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000);
            console.log(`   🔍 [FOCUS_WINDOW] Recherche créneau libre entre ${windowStart.toISOString()} et ${windowEnd.toISOString()} (min 25 min)`);
            
            const freeBlock = this.findFirstFreeBlock(busy, windowStart, windowEnd, 25);
            if (!freeBlock) {
                console.log(`   ⏭️  [FOCUS_WINDOW] Ignoré: aucun créneau libre ≥25 min trouvé`);
                if (busy.length > 0) {
                    console.log(`   📊 [FOCUS_WINDOW] Détail périodes occupées:`);
                    busy.forEach((period, i) => {
                        console.log(`      ${i + 1}. ${period.start.toISOString()} → ${period.end.toISOString()}`);
                    });
                }
                return { skipped: true, reason: 'no_free_block' };
            }

            console.log(`   ✅ [FOCUS_WINDOW] Créneau libre trouvé: ${freeBlock.start.toISOString()} → ${freeBlock.end.toISOString()} (${freeBlock.durationMinutes} min)`);

            const content = "Tu as un créneau libre. Moment parfait pour te concentrer sur une tâche planifiée.";
            const notification = await this.createNotification(userId, 'FOCUS_WINDOW', content, now, {
                pushTitle: '🎯 Tu as du temps pour te concentrer',
                pushBody: 'Créneau libre détecté. Moment parfait pour te concentrer.',
                assistantMessage: content
            });
            
            console.log(`   📨 [FOCUS_WINDOW] ✅ Notification créée: ${notification?.id || 'N/A'}`);
            return { created: true, notification, freeBlock };
            
        } catch (error) {
            console.error(`   ❌ [FOCUS_WINDOW] Erreur pour user ${userId}:`, error.message);
            NotificationLogger.logError('Planification Focus Window', error);
            return { error: error.message };
        }
    }

    async scheduleLunchBreak(userId, date) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { notificationSettings: true }
            });
            if (!user?.notificationSettings?.isEnabled) return;
            if (!this.canSendNotification(user.notificationSettings, date)) return;

            const { start } = this.getDayRange(date);
            const activityMinutes = await this.getRecentActivityMinutes(userId, start);
            const busyMorning = await this.getBusyPeriods(userId, start, date);
            const tasks = await this.getTasksBetween(userId, start, date);
            const hasWorked = activityMinutes >= 25 || busyMorning.length >= 1;
            const denseMorning = busyMorning.length >= 2 || tasks.length >= 3 || activityMinutes >= 60;
            if (!hasWorked || !denseMorning) return;

            const content = "Prends une pause. La récupération fait partie de la performance.";
            await this.createNotification(userId, 'LUNCH_BREAK', content, date, {
                pushTitle: '🍽️ Temps de faire une pause',
                pushBody: 'Prends une pause. La récupération fait partie de la performance.',
                assistantMessage: content
            });

            await this.schedulePostLunchRestart(userId, date);
        } catch (error) {
            NotificationLogger.logError('Planification Lunch Break', error);
        }
    }

    async schedulePostLunchRestart(userId, lunchDate) {
        try {
            const delayMinutes = 30 + Math.floor(Math.random() * 61); // 30-90
            const scheduledFor = new Date(lunchDate.getTime() + delayMinutes * 60000);
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { notificationSettings: true }
            });
            if (!user?.notificationSettings?.isEnabled) return;
            if (!this.canSendNotification(user.notificationSettings, scheduledFor)) return;

            const { end } = this.getDayRange(lunchDate);
            const tasks = await this.getTasksBetween(userId, lunchDate, end);
            if (!tasks.length) return;

            const busy = await this.getBusyPeriods(userId, lunchDate, end);
            const freeBlock = this.findFirstFreeBlock(busy, scheduledFor, new Date(scheduledFor.getTime() + 2 * 60 * 60 * 1000), 20);
            if (!freeBlock) return;

            const content = "Un peu de concentration maintenant vaut mieux qu'un stress intense plus tard.";
            await this.createNotification(userId, 'POST_LUNCH_RESTART', content, scheduledFor, {
                pushTitle: '🔁 Prêt à reprendre ?',
                pushBody: 'Un peu de concentration maintenant vaut mieux qu\'un stress intense plus tard.',
                assistantMessage: content
            });
        } catch (error) {
            NotificationLogger.logError('Planification Post Lunch Restart', error);
        }
    }

    async scheduleStressCheckPremium(userId, date) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { notificationSettings: true }
            });
            if (!user?.notificationSettings?.isEnabled) return;
            if (!this.canSendNotification(user.notificationSettings, date)) return;

            const premium = (user.subscriptionStatus && ['active', 'trialing', 'paid'].includes(user.subscriptionStatus)) ||
                (user.subscriptionTier && ['pro', 'premium', 'starter', 'enterprise', 'paid'].includes(user.subscriptionTier?.toLowerCase())) ||
                !!user.stripeSubscriptionId;
            if (!premium) return;

            const { start } = this.getDayRange(date);
            const alreadyChecked = await this.prisma.behaviorCheckIn.count({
                where: {
                    userId,
                    type: 'stress',
                    timestamp: { gte: start }
                }
            });
            if (alreadyChecked > 0) return;

            const activityMinutes = await this.getRecentActivityMinutes(userId, start);
            const busy = await this.getBusyPeriods(userId, start, date);
            const denseDay = activityMinutes >= 60 || busy.length >= 3;
            if (!denseDay) return;

            const content = "Check-in rapide. À quel point te sens-tu stressé(e) en ce moment ?";
            await this.createNotification(userId, 'STRESS_CHECK_PREMIUM', content, date, {
                pushTitle: '🧠 Check-in stress',
                pushBody: 'Check-in rapide. À quel point te sens-tu stressé(e) en ce moment ?',
                assistantMessage: content
            });
        } catch (error) {
            NotificationLogger.logError('Planification Stress Check Premium', error);
        }
    }

    async scheduleMoodCheckPremium(userId, date) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { notificationSettings: true }
            });
            if (!user?.notificationSettings?.isEnabled) return;
            if (!this.canSendNotification(user.notificationSettings, date)) return;

            const premium = (user.subscriptionStatus && ['active', 'trialing', 'paid'].includes(user.subscriptionStatus)) ||
                (user.subscriptionTier && ['pro', 'premium', 'starter', 'enterprise', 'paid'].includes(user.subscriptionTier?.toLowerCase())) ||
                !!user.stripeSubscriptionId;
            if (!premium) return;

            const { start } = this.getDayRange(date);
            const alreadyChecked = await this.prisma.behaviorCheckIn.count({
                where: {
                    userId,
                    type: 'mood',
                    timestamp: { gte: start }
                }
            });
            if (alreadyChecked > 0) return;

            const content = "Comment s'est passée ta journée dans l'ensemble ?";
            await this.createNotification(userId, 'MOOD_CHECK_PREMIUM', content, date, {
                pushTitle: '🙂 Check-in humeur',
                pushBody: 'Comment s\'est passée ta journée dans l\'ensemble ?',
                assistantMessage: content
            });
        } catch (error) {
            NotificationLogger.logError('Planification Mood Check Premium', error);
        }
    }

    async scheduleFocusCheckPremium(userId, date) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { notificationSettings: true }
            });
            if (!user?.notificationSettings?.isEnabled) return;
            if (!this.canSendNotification(user.notificationSettings, date)) return;

            const premium = (user.subscriptionStatus && ['active', 'trialing', 'paid'].includes(user.subscriptionStatus)) ||
                (user.subscriptionTier && ['pro', 'premium', 'starter', 'enterprise', 'paid'].includes(user.subscriptionTier?.toLowerCase())) ||
                !!user.stripeSubscriptionId;
            if (!premium) return;

            const { start } = this.getDayRange(date);
            const alreadyChecked = await this.prisma.behaviorCheckIn.count({
                where: {
                    userId,
                    type: 'focus',
                    timestamp: { gte: start }
                }
            });
            if (alreadyChecked > 0) return;

            const content = "🎯 Focus actuel sur 1-10 ?\n\nQuelle est la prochaine tâche à faire en 25 minutes ? (une seule, claire).";
            await this.createNotification(userId, 'FOCUS_CHECK_PREMIUM', content, date, {
                pushTitle: '🎯 Check-in focus',
                pushBody: 'Focus actuel sur 1-10 ? Quelle est la prochaine tâche à faire en 25 minutes ?',
                assistantMessage: content
            });
        } catch (error) {
            NotificationLogger.logError('Planification Focus Check Premium', error);
        }
    }

    async scheduleEveningPlan(userId, date) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { notificationSettings: true }
            });
            if (!user?.notificationSettings?.isEnabled) return;
            if (!this.canSendNotification(user.notificationSettings, date)) return;

            const tomorrow = new Date(date);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const { start, end } = this.getDayRange(tomorrow);
            const tasksTomorrow = await this.getTasksBetween(userId, start, end);
            if (tasksTomorrow.length > 0) {
                return;
            }

            const content = "Planifier demain prend 2 minutes. Ton esprit te remerciera.";
            await this.createNotification(userId, 'EVENING_PLAN', content, date, {
                pushTitle: '🌙 Planifie demain',
                pushBody: 'Planifier demain prend 2 minutes.',
                assistantMessage: content
            });
        } catch (error) {
            NotificationLogger.logError('Planification Evening Plan', error);
        }
    }
}

// Générateur d'ID unique pour chaque notification
function generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Logger avec timestamp précis
function logWithTimestamp(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const milliseconds = new Date().getMilliseconds().toString().padStart(3, '0');
    console.log(`[${timestamp}.${milliseconds}] [${level}] ${message}`, data ? JSON.stringify(data) : '');
}

async function sendWhatsAppMessage(phoneNumber, message, notificationId = null) {
    const sendId = uuidv4();
    const startTime = Date.now();
    
    logWithTimestamp('INFO', '📱 DÉBUT ENVOI WHATSAPP', {
        sendId,
        notificationId,
        phoneNumber,
        messageLength: message.length,
        thread: process.pid
    });

    try {
        const requestStart = Date.now();
        
        // Préparation de la requête
        const whatsappPayload = {
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "text",
            text: { body: message }
        };

        logWithTimestamp('DEBUG', '🔄 ENVOI REQUÊTE WHATSAPP - DÉBUT', {
            sendId,
            notificationId,
            url: `${process.env.WHATSAPP_API_URL}/messages`,
            payload: whatsappPayload
        });

        const response = await fetch(`${process.env.WHATSAPP_API_URL}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(whatsappPayload)
        });

        const requestDuration = Date.now() - requestStart;
        const responseText = await response.text();
        
        logWithTimestamp('DEBUG', '📬 RÉPONSE WHATSAPP REÇUE', {
            sendId,
            notificationId,
            status: response.status,
            statusText: response.statusText,
            requestDuration,
            responseLength: responseText.length,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            logWithTimestamp('ERROR', '❌ ERREUR RESPONSE WHATSAPP', {
                sendId,
                notificationId,
                status: response.status,
                response: responseText,
                requestDuration
            });
            throw new Error(`WhatsApp API error: ${response.status} - ${responseText}`);
        }

        const responseData = JSON.parse(responseText);
        const totalDuration = Date.now() - startTime;

        logWithTimestamp('SUCCESS', '✅ MESSAGE WHATSAPP ENVOYÉ', {
            sendId,
            notificationId,
            whatsappMessageId: responseData.messages?.[0]?.id,
            whatsappWaId: responseData.contacts?.[0]?.wa_id,
            requestDuration,
            totalDuration,
            responseData
        });

        return {
            success: true,
            messageId: responseData.messages?.[0]?.id,
            waId: responseData.contacts?.[0]?.wa_id,
            sendId,
            duration: totalDuration
        };

    } catch (error) {
        const totalDuration = Date.now() - startTime;
        
        logWithTimestamp('ERROR', '❌ ERREUR ENVOI WHATSAPP', {
            sendId,
            notificationId,
            error: error.message,
            stack: error.stack,
            totalDuration
        });
        
        throw error;
    }
}

export default new NotificationService();
