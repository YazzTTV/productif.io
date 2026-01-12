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

            if (!settings?.whatsappEnabled || !userPhoneNumber) {
                NotificationLogger.logError('Configuration WhatsApp', new Error('WhatsApp non configuré pour l\'utilisateur'));
                await this.prisma.notificationHistory.update({
                    where: { id: notification.id },
                    data: {
                        status: 'failed',
                        error: 'WhatsApp non configuré'
                    }
                });
                return;
            }
            
            // Système de templates désactivé - tous les messages sont envoyés en texte normal
            console.log(`🔵 [${processingId}] Envoi WhatsApp pour notification ${notification.id} (type: ${notification.type}, mode: texte normal)`);
            
            // Formater le message avec titre
            const messageContent = this.formatWhatsAppMessage(notification);
            
            // Envoyer sans template
            await this.whatsappService.sendMessage(userPhoneNumber, messageContent, notification.id, null);
            console.log(`🔵 [${processingId}] WhatsApp envoyé avec succès pour notification ${notification.id}`);
            
            // Envoyer aussi une notification push si activée
            if (settings?.pushEnabled) {
                try {
                    const { sendPushNotification } = await import('../../lib/apns.js');
                    // Utiliser les titres/corps courts si disponibles pour le push,
                    // sinon fallback sur le titre générique + extrait du contenu
                    const title = notification.pushTitle || getNotificationTitle(notification.type);
                    const body = notification.pushBody || this.extractBodyFromContent(notification.content);
                    
                    // Déterminer l'action selon le type de notification
                    let action = 'open_assistant';
                    let checkInType = null;
                    
                    // Pour les notifications mood/stress/focus, rediriger vers Analytics
                    if (notification.type === 'MOOD_CHECK') {
                        action = 'open_analytics';
                        checkInType = 'mood';
                    } else if (notification.type === 'STRESS_CHECK') {
                        action = 'open_analytics';
                        checkInType = 'stress';
                    } else if (notification.type === 'FOCUS_CHECK') {
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

    async scheduleMoodCheckNotification(userId, date) {
        try {
            // Message complet utilisé pour WhatsApp + assistant IA
            const content = "🙂 Comment te sens-tu maintenant ?\n\nRéponds en notant ton humeur sur 1-10 et ajoute un mot-clé (ex: \"8, serein\").";

            // Version courte pour la push
            const shortTitle = '🙂 Humeur du moment';
            const shortBody = 'Note ton humeur sur 10';

            await this.createNotification(
              userId,
              'MOOD_CHECK',
              content,
              date,
              {
                pushTitle: shortTitle,
                pushBody: shortBody,
                assistantMessage: content,
              }
            );
        } catch (error) {
            NotificationLogger.logError('Planification de la question humeur', error);
        }
    }

    async scheduleStressCheckNotification(userId, date) {
        try {
            // Message complet utilisé pour WhatsApp + assistant IA
            const content = "😌 Ton niveau de stress sur 1-10 ?\n\nQu'est-ce qui aide le plus à réduire la pression ? (respiration, pause, priorisation, déconnexion).";

            // Version courte pour la push
            const shortTitle = '😌 Stress du moment';
            const shortBody = 'Note ton niveau de stress sur 10';

            await this.createNotification(
              userId,
              'STRESS_CHECK',
              content,
              date,
              {
                pushTitle: shortTitle,
                pushBody: shortBody,
                assistantMessage: content,
              }
            );
        } catch (error) {
            NotificationLogger.logError('Planification de la question stress', error);
        }
    }

    async scheduleFocusCheckNotification(userId, date) {
        try {
            // Message complet utilisé pour WhatsApp + assistant IA
            const content = "🎯 Focus actuel sur 1-10 ?\n\nQuelle est la prochaine tâche à faire en 25 minutes ? (une seule, claire).";

            // Version courte pour la push
            const shortTitle = '🎯 Check Focus';
            const shortBody = 'Note ton niveau de focus sur 10';

            await this.createNotification(
              userId,
              'FOCUS_CHECK',
              content,
              date,
              {
                pushTitle: shortTitle,
                pushBody: shortBody,
                assistantMessage: content,
              }
            );
        } catch (error) {
            NotificationLogger.logError('Planification de la question focus', error);
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
