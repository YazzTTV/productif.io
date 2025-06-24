const axios = require('axios');
const whatsappConfig = require('../config/whatsapp');
const aiService = require('./aiService');
const notificationService = require('./notifications/notificationService');
const { MongoClient } = require('mongodb');

class WhatsAppService {
    constructor() {
        this.axios = axios.create({
            baseURL: whatsappConfig.baseUrl,
            headers: {
                'Authorization': `Bearer ${whatsappConfig.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        this.mongoClient = new MongoClient(process.env.MONGODB_URI);
    }

    async sendMessage(to, message) {
        try {
            // Nettoyer le numéro de téléphone
            const cleanPhoneNumber = to.replace(/\D/g, '');
            
            const response = await this.axios.post(
                `/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: cleanPhoneNumber,
                    type: "text",
                    text: { 
                        preview_url: false,
                        body: message 
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error sending WhatsApp message:', error.response?.data || error.message);
            throw error;
        }
    }

    async handleIncomingMessage(message) {
        try {
            const userId = message.from;
            const messageText = message.text.body;

            console.log(`Message reçu de ${userId}: ${messageText}`);

            // Traiter le message avec l'agent IA
            const aiResponse = await aiService.processMessage(userId, messageText);
            console.log('Réponse de l\'IA:', aiResponse);

            // Envoyer la réponse
            await this.sendMessage(userId, aiResponse.response);

            return {
                success: true,
                response: aiResponse
            };
        } catch (error) {
            console.error('Erreur lors du traitement du message:', error);
            // Envoyer un message d'erreur à l'utilisateur
            await this.sendMessage(message.from, 
                "Désolé, j'ai rencontré une erreur lors du traitement de votre message. " +
                "Pouvez-vous réessayer dans quelques instants ?"
            );
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getBusinessProfile() {
        try {
            const response = await this.axios.get(
                `/${whatsappConfig.apiVersion}/phone_numbers/${whatsappConfig.phoneNumberId}`
            );
            return response.data;
        } catch (error) {
            console.error('Error getting business profile:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Envoie une notification via WhatsApp ou Web
     */
    async sendNotification(notification) {
        try {
            const { userId, type, content } = notification;

            // Vérifier si la notification peut être envoyée
            const canSend = await notificationService.canSendNotification(
                userId,
                type,
                new Date()
            );

            if (!canSend) {
                console.log(`Notification non envoyée pour l'utilisateur ${userId} (préférences non satisfaites)`);
                return null;
            }

            // Récupérer les préférences de notification de l'utilisateur
            await this.mongoClient.connect();
            const db = this.mongoClient.db('plannificateur');
            const preferences = await db.collection('UserNotificationPreference').findOne({
                userId
            });

            // Si WhatsApp est activé et un numéro est configuré
            if (preferences?.whatsappEnabled && preferences?.whatsappNumber) {
                try {
                    // Envoyer via WhatsApp
                    const result = await this.sendMessage(preferences.whatsappNumber, content);
                    if (result) {
                        await notificationService.markAsSent(notification.id);
                        return result;
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'envoi WhatsApp, tentative de notification web:', error);
                }
            }

            // Par défaut ou en cas d'échec de WhatsApp, envoyer une notification web
            if (preferences?.pushEnabled !== false) { // Activé par défaut
                try {
                    // Envoyer une notification web
                    const webNotification = new Notification(type, {
                        body: content,
                        icon: '/icon.png'
                    });
                    
                    await notificationService.markAsSent(notification.id);
                    return { success: true, method: 'web' };
                } catch (error) {
                    console.error('Erreur lors de l\'envoi de la notification web:', error);
                    throw error;
                }
            }

            console.log(`Aucune méthode de notification disponible pour l'utilisateur ${userId}`);
            return null;
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification:', error);
            await notificationService.markAsFailed(notification.id, error);
            throw error;
        } finally {
            await this.mongoClient.close();
        }
    }
}

module.exports = new WhatsAppService(); 