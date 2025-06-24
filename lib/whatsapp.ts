import { whatsappConfig } from '@/config/whatsapp';
import axios, { AxiosError } from 'axios';

class WhatsAppService {
    private axios;
    private baseUrl = 'https://graph.facebook.com';
    private apiVersion = 'v17.0';

    constructor() {
        // Vérifier que la configuration est complète
        if (!whatsappConfig.phoneNumberId) {
            console.error('❌ Configuration WhatsApp invalide: WHATSAPP_PHONE_NUMBER_ID manquant');
        }
        if (!whatsappConfig.accessToken) {
            console.error('❌ Configuration WhatsApp invalide: WHATSAPP_ACCESS_TOKEN manquant');
        }

        console.log('📱 Configuration WhatsApp:', {
            baseUrl: this.baseUrl,
            apiVersion: this.apiVersion,
            phoneNumberId: whatsappConfig.phoneNumberId ? 'défini' : 'manquant',
            accessToken: whatsappConfig.accessToken ? 'défini' : 'manquant'
        });

        this.axios = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${whatsappConfig.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async sendMessage(to: string, message: string) {
        try {
            // Vérifier la configuration
            if (!whatsappConfig.phoneNumberId || !whatsappConfig.accessToken) {
                throw new Error('Configuration WhatsApp incomplète. Vérifiez WHATSAPP_PHONE_NUMBER_ID et WHATSAPP_ACCESS_TOKEN');
            }

            // Nettoyer le numéro de téléphone
            const cleanPhoneNumber = to.replace(/\D/g, '');
            
            console.log('📤 Envoi du message WhatsApp:', {
                to: cleanPhoneNumber,
                phoneNumberId: whatsappConfig.phoneNumberId,
                messageLength: message.length
            });

            const response = await this.axios.post(
                `/${this.apiVersion}/${whatsappConfig.phoneNumberId}/messages`,
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

            console.log('✅ Message envoyé avec succès:', response.data);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.error('❌ Erreur lors de l\'envoi du message WhatsApp:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
            } else {
                console.error('❌ Erreur lors de l\'envoi du message WhatsApp:', error);
            }
            throw error;
        }
    }
}

// Créer une instance unique du service
export const whatsappService = new WhatsAppService(); 