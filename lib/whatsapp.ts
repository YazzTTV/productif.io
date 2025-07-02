import { whatsappConfig } from '@/config/whatsapp';
import axios, { AxiosError } from 'axios';

// Cache pour éviter les duplicatas
const messageSent = new Set<string>();

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
            
            // 🛡️ DÉDUPLICATION : Créer une référence unique SANS timestamp
            // Utiliser une fenêtre de 5 minutes pour la déduplication
            const timeWindow = Math.floor(Date.now() / (5 * 60 * 1000)); // 5 minutes
            const messageHash = Buffer.from(`${cleanPhoneNumber}_${message}_${timeWindow}`).toString('base64').substring(0, 16);
            const uniqueReference = `PRODUCTIF_${messageHash}`;
            
            // Vérifier si ce message a déjà été envoyé dans cette fenêtre de temps
            if (messageSent.has(uniqueReference)) {
                console.log('🛡️ DUPLICATA BLOQUÉ:', {
                    to: cleanPhoneNumber,
                    reference: uniqueReference,
                    messageLength: message.length,
                    timeWindow,
                    reason: 'global_deduplication_5min_window'
                });
                return { blocked: true, reason: 'duplicate_blocked', reference: uniqueReference };
            }
            
            // Marquer le message comme envoyé
            messageSent.add(uniqueReference);
            
            console.log('📤 Envoi du message WhatsApp:', {
                to: cleanPhoneNumber,
                phoneNumberId: whatsappConfig.phoneNumberId,
                messageLength: message.length,
                uniqueReference,
                timeWindow
            });

            const response = await this.axios.post(
                `/${this.apiVersion}/${whatsappConfig.phoneNumberId}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: cleanPhoneNumber,
                    type: "text",
                    text: { 
                        preview_url: false,
                        body: `${message}\n\n_Ref: ${uniqueReference}_`
                    }
                }
            );

            console.log('✅ Message envoyé avec succès:', {
                ...response.data,
                uniqueReference
            });
            
            // Nettoyer le cache automatiquement après 10 minutes
            setTimeout(() => {
                messageSent.delete(uniqueReference);
            }, 10 * 60 * 1000);
            
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