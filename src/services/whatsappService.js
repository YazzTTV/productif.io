import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import NotificationLogger from './NotificationLogger.js';
import { v4 as uuidv4 } from 'uuid';

class WhatsAppService {
    constructor() {
        this.serviceId = uuidv4();
        this.requestCounter = 0;
        this.activeRequests = new Map();
        
        NotificationLogger.log('INFO', 'WHATSAPP_SERVICE_INIT', {
            serviceId: this.serviceId,
            initTime: new Date().toISOString()
        });

        // Vérifier les variables d'environnement avec logs détaillés
        const envCheck = {
            WHATSAPP_APP_ID: !!process.env.WHATSAPP_APP_ID,
            WHATSAPP_APP_SECRET: !!process.env.WHATSAPP_APP_SECRET,
            WHATSAPP_ACCESS_TOKEN: !!process.env.WHATSAPP_ACCESS_TOKEN,
            WHATSAPP_BUSINESS_ACCOUNT_ID: !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
            WHATSAPP_VERIFY_TOKEN: !!process.env.WHATSAPP_VERIFY_TOKEN,
            WHATSAPP_PHONE_NUMBER_ID: !!process.env.WHATSAPP_PHONE_NUMBER_ID
        };

        NotificationLogger.log('INFO', 'WHATSAPP_ENV_CHECK', {
            serviceId: this.serviceId,
            env: envCheck,
            missingVars: Object.keys(envCheck).filter(key => !envCheck[key])
        });

        // Configuration de l'API WhatsApp
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.apiUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}`;
        this.token = process.env.WHATSAPP_ACCESS_TOKEN || '';
        this.prisma = new PrismaClient();

        NotificationLogger.log('INFO', 'WHATSAPP_CONFIG_LOADED', {
            serviceId: this.serviceId,
            apiUrl: this.apiUrl,
            phoneNumberId,
            tokenPresent: !!this.token,
            tokenLength: this.token.length
        });

        // Legacy console logs for backward compatibility
        console.log('Variables d\'environnement WhatsApp :');
        console.log('WHATSAPP_APP_ID:', process.env.WHATSAPP_APP_ID ? '✅' : '❌');
        console.log('WHATSAPP_APP_SECRET:', process.env.WHATSAPP_APP_SECRET ? '✅' : '❌');
        console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅' : '❌');
        console.log('WHATSAPP_BUSINESS_ACCOUNT_ID:', process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? '✅' : '❌');
        console.log('WHATSAPP_VERIFY_TOKEN:', process.env.WHATSAPP_VERIFY_TOKEN ? '✅' : '❌');
        console.log('WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅' : '❌');
        console.log('Configuration WhatsApp :');
        console.log('API_URL:', this.apiUrl);
        console.log('PHONE_NUMBER_ID:', phoneNumberId);
        console.log('🔍 Configuration WhatsApp chargée');
        console.log('🔗 URL de l\'API configurée:', this.apiUrl);
        console.log('🔑 Token configuré:', this.token ? `${this.token.substring(0, 10)}...` : '❌');
    }

    formatPhoneNumber(phoneNumber) {
        const formatStart = Date.now();
        const originalNumber = phoneNumber;
        
        // Supprimer tous les caractères non numériques
        let cleaned = phoneNumber.replace(/\D/g, '');
        
        // Si le numéro commence par un 0, le remplacer par 33
        if (cleaned.startsWith('0')) {
            cleaned = '33' + cleaned.substring(1);
        }

        const formatDuration = Date.now() - formatStart;
        
        NotificationLogger.log('DEBUG', 'PHONE_NUMBER_FORMATTED', {
            serviceId: this.serviceId,
            original: originalNumber,
            formatted: cleaned,
            formatDuration
        });

        return cleaned;
    }

    async sendMessage(phoneNumber, message, notificationId = null) {
        const sendId = uuidv4();
        const requestStart = Date.now();
        this.requestCounter++;
        
        // Log de début d'envoi
        NotificationLogger.logWhatsAppSendStart({
            sendId,
            notificationId,
            phoneNumber,
            messageLength: message.length,
            requestNumber: this.requestCounter,
            serviceId: this.serviceId
        });

        // Vérification de concurrence pour le même numéro
        const concurrencyKey = `${phoneNumber}-${Date.now()}`;
        if (this.activeRequests.has(phoneNumber)) {
            NotificationLogger.logConcurrencyEvent({
                event: 'CONCURRENT_WHATSAPP_REQUEST',
                userId: phoneNumber,
                conflictType: 'SAME_PHONE_NUMBER',
                sendId,
                existingRequest: this.activeRequests.get(phoneNumber)
            });
        }
        
        this.activeRequests.set(phoneNumber, {
            sendId,
            startTime: requestStart,
            notificationId
        });

        try {
            // Formater le numéro de téléphone
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            // Préparer le payload
            const payload = {
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'text',
                text: {
                    preview_url: false,
                    body: message
                }
            };

            // Log de début de requête HTTP
            NotificationLogger.logWhatsAppRequestStart({
                sendId,
                notificationId,
                url: `${this.apiUrl}/messages`,
                payload,
                formattedPhone
            });

            const httpStart = Date.now();
            
            // Envoi de la requête
            const response = await fetch(`${this.apiUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(payload)
            });

            const httpDuration = Date.now() - httpStart;
            const responseText = await response.text();
            
            // Log de réponse reçue
            NotificationLogger.logWhatsAppResponse({
                sendId,
                notificationId,
                status: response.status,
                statusText: response.statusText,
                requestDuration: httpDuration,
                responseLength: responseText.length,
                headers: Object.fromEntries(response.headers.entries())
            });

            // Legacy logging
            NotificationLogger.logWhatsAppSending(phoneNumber, message);
            NotificationLogger.logWhatsAppResponse(response.status, responseText);

            if (!response.ok) {
                NotificationLogger.log('ERROR', 'WHATSAPP_HTTP_ERROR', {
                    sendId,
                    notificationId,
                    status: response.status,
                    statusText: response.statusText,
                    response: responseText,
                    requestDuration: httpDuration
                });
                
                throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}\n${responseText}`);
            }

            const responseData = JSON.parse(responseText);
            const totalDuration = Date.now() - requestStart;

            // Log de succès
            NotificationLogger.logWhatsAppSuccess({
                sendId,
                notificationId,
                whatsappMessageId: responseData.messages?.[0]?.id,
                whatsappWaId: responseData.contacts?.[0]?.wa_id,
                requestDuration: httpDuration,
                totalDuration
            });

            return responseData;

        } catch (error) {
            const totalDuration = Date.now() - requestStart;
            
            NotificationLogger.logWhatsAppError({
                sendId,
                notificationId,
                error: error.message,
                stack: error.stack,
                totalDuration
            });

            // Legacy error logging
            NotificationLogger.logError('Envoi WhatsApp', error);
            
            throw error;
        } finally {
            // Nettoyer la requête active
            this.activeRequests.delete(phoneNumber);
            
            NotificationLogger.log('DEBUG', 'WHATSAPP_REQUEST_CLEANUP', {
                sendId,
                activeRequests: this.activeRequests.size,
                totalDuration: Date.now() - requestStart
            });
        }
    }

    async sendNotification(notification) {
        const processStart = Date.now();
        const processId = uuidv4();
        
        NotificationLogger.log('INFO', 'WHATSAPP_NOTIFICATION_START', {
            processId,
            notificationId: notification.id,
            type: notification.type,
            userId: notification.userId,
            scheduledFor: notification.scheduledFor,
            serviceId: this.serviceId
        });

        try {
            // Legacy logging
            NotificationLogger.logNotificationProcessing(notification);

            // Récupération de l'utilisateur avec timing
            const userQueryStart = Date.now();
            
            const user = await this.prisma.user.findUnique({
                where: { id: notification.userId },
                include: {
                    notificationSettings: true
                }
            });

            const userQueryDuration = Date.now() - userQueryStart;

            NotificationLogger.log('DEBUG', 'USER_QUERY_COMPLETE', {
                processId,
                notificationId: notification.id,
                userFound: !!user,
                hasSettings: !!user?.notificationSettings,
                whatsappEnabled: user?.notificationSettings?.whatsappEnabled,
                hasPhoneNumber: !!user?.notificationSettings?.whatsappNumber,
                userQueryDuration
            });

            // Vérifications de configuration
            if (!user) {
                NotificationLogger.log('ERROR', 'USER_NOT_FOUND', {
                    processId,
                    notificationId: notification.id,
                    userId: notification.userId
                });
                return;
            }

            if (!user.notificationSettings?.whatsappEnabled) {
                NotificationLogger.log('WARN', 'WHATSAPP_DISABLED', {
                    processId,
                    notificationId: notification.id,
                    userId: notification.userId,
                    email: user.email
                });
                return;
            }

            if (!user.notificationSettings?.whatsappNumber) {
                NotificationLogger.log('ERROR', 'WHATSAPP_NUMBER_MISSING', {
                    processId,
                    notificationId: notification.id,
                    userId: notification.userId,
                    email: user.email
                });
                return;
            }

            // Envoi du message avec traçage
            const messageStart = Date.now();
            const messageResult = await this.sendMessage(
                user.notificationSettings.whatsappNumber, 
                notification.content,
                notification.id
            );
            const messageDuration = Date.now() - messageStart;

            // Mise à jour de la base de données avec timing
            const dbUpdateStart = Date.now();
            
            await this.prisma.notificationHistory.update({
                where: { id: notification.id },
                data: {
                    status: 'sent',
                    sentAt: new Date()
                }
            });

            const dbUpdateDuration = Date.now() - dbUpdateStart;
            const totalDuration = Date.now() - processStart;

            NotificationLogger.log('SUCCESS', 'WHATSAPP_NOTIFICATION_COMPLETE', {
                processId,
                notificationId: notification.id,
                whatsappMessageId: messageResult.messages?.[0]?.id,
                userQueryDuration,
                messageDuration,
                dbUpdateDuration,
                totalDuration
            });

        } catch (error) {
            const totalDuration = Date.now() - processStart;
            
            NotificationLogger.log('ERROR', 'WHATSAPP_NOTIFICATION_ERROR', {
                processId,
                notificationId: notification.id,
                error: error.message,
                stack: error.stack,
                totalDuration
            });

            // Legacy error logging
            NotificationLogger.logError('Envoi de notification', error);
            
            // Mise à jour de l'erreur en base
            try {
                const errorUpdateStart = Date.now();
                
            await this.prisma.notificationHistory.update({
                where: { id: notification.id },
                data: {
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });

                const errorUpdateDuration = Date.now() - errorUpdateStart;
                
                NotificationLogger.log('DEBUG', 'ERROR_STATUS_UPDATED', {
                    processId,
                    notificationId: notification.id,
                    errorUpdateDuration
                });
                
            } catch (updateError) {
                NotificationLogger.log('ERROR', 'ERROR_STATUS_UPDATE_FAILED', {
                    processId,
                    notificationId: notification.id,
                    updateError: updateError.message
                });
            }
            
            throw error;
        }
    }

    getStatus() {
        return {
            serviceId: this.serviceId,
            requestCounter: this.requestCounter,
            activeRequests: this.activeRequests.size,
            apiUrl: this.apiUrl,
            tokenConfigured: !!this.token
        };
    }
}

// Créer une instance unique
const whatsappService = new WhatsAppService();

// Exporter l'instance
export default whatsappService;
