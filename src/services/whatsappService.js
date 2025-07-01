import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import NotificationLogger from './NotificationLogger.js';
class WhatsAppService {
    constructor() {
        // Vérifier les variables d'environnement
        console.log('Variables d\'environnement WhatsApp :');
        console.log('WHATSAPP_APP_ID:', process.env.WHATSAPP_APP_ID ? '✅' : '❌');
        console.log('WHATSAPP_APP_SECRET:', process.env.WHATSAPP_APP_SECRET ? '✅' : '❌');
        console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅' : '❌');
        console.log('WHATSAPP_BUSINESS_ACCOUNT_ID:', process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? '✅' : '❌');
        console.log('WHATSAPP_VERIFY_TOKEN:', process.env.WHATSAPP_VERIFY_TOKEN ? '✅' : '❌');
        console.log('WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅' : '❌');
        // Configuration de l'API WhatsApp
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.apiUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}`;
        this.token = process.env.WHATSAPP_ACCESS_TOKEN || '';
        this.prisma = new PrismaClient();
        console.log('Configuration WhatsApp :');
        console.log('API_URL:', this.apiUrl);
        console.log('PHONE_NUMBER_ID:', phoneNumberId);
        console.log('🔍 Configuration WhatsApp chargée');
        console.log('🔗 URL de l\'API configurée:', this.apiUrl);
        console.log('🔑 Token configuré:', this.token ? `${this.token.substring(0, 10)}...` : '❌');
    }
    formatPhoneNumber(phoneNumber) {
        // Supprimer tous les caractères non numériques
        let cleaned = phoneNumber.replace(/\D/g, '');
        // Si le numéro commence par un 0, le remplacer par 33
        if (cleaned.startsWith('0')) {
            cleaned = '33' + cleaned.substring(1);
        }
        return cleaned;
    }
    async sendMessage(phoneNumber, message) {
        try {
            NotificationLogger.logWhatsAppSending(phoneNumber, message);
            const response = await fetch(`${this.apiUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: this.formatPhoneNumber(phoneNumber),
                    type: 'text',
                    text: {
                        preview_url: false,
                        body: message
                    }
                })
            });
            const responseText = await response.text();
            NotificationLogger.logWhatsAppResponse(response.status, responseText);
            if (!response.ok) {
                throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}\n${responseText}`);
            }
            return JSON.parse(responseText);
        }
        catch (error) {
            NotificationLogger.logError('Envoi WhatsApp', error);
            throw error;
        }
    }
    async sendNotification(notification) {
        try {
            NotificationLogger.logNotificationProcessing(notification);
            const user = await this.prisma.user.findUnique({
                where: { id: notification.userId },
                include: {
                    notificationSettings: true
                }
            });
            if (!user || !user.notificationSettings?.whatsappEnabled || !user.notificationSettings?.whatsappNumber) {
                NotificationLogger.logError('Configuration WhatsApp', new Error('WhatsApp non configuré pour l\'utilisateur'));
                return;
            }
            await this.sendMessage(user.notificationSettings.whatsappNumber, notification.content);
            // Mettre à jour le statut de la notification
            await this.prisma.notificationHistory.update({
                where: { id: notification.id },
                data: {
                    status: 'sent',
                    sentAt: new Date()
                }
            });
        }
        catch (error) {
            NotificationLogger.logError('Envoi de notification', error);
            // Marquer la notification comme échouée
            await this.prisma.notificationHistory.update({
                where: { id: notification.id },
                data: {
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
    }
}
// Créer une instance unique
const whatsappService = new WhatsAppService();
// Exporter l'instance
export default whatsappService;
