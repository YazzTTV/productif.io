const axios = require('axios');
const whatsappConfig = require('../config/whatsapp');
const aiService = require('./aiService');

class WhatsAppService {
    constructor() {
        this.axios = axios.create({
            baseURL: whatsappConfig.baseUrl,
            headers: {
                'Authorization': `Bearer ${whatsappConfig.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
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
}

module.exports = new WhatsAppService(); 