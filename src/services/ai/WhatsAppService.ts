import axios from 'axios';

// 🛡️ DÉDUPLICATION GLOBALE : Cache des messages envoyés
const messageSent = new Set<string>();

export class WhatsAppService {
    private apiUrl: string;
    private accessToken: string;
    private phoneNumberId: string;

    constructor() {
        if (!process.env.WHATSAPP_API_URL) {
            throw new Error('WHATSAPP_API_URL is not defined');
        }
        if (!process.env.WHATSAPP_ACCESS_TOKEN) {
            throw new Error('WHATSAPP_ACCESS_TOKEN is not defined');
        }
        if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
            throw new Error('WHATSAPP_PHONE_NUMBER_ID is not defined');
        }

        this.apiUrl = process.env.WHATSAPP_API_URL;
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    }

    async sendMessage(to: string, message: string): Promise<void> {
        try {
            // Nettoyer le numéro de téléphone
            const cleanPhoneNumber = to.replace(/\D/g, '');
            
            // 🛡️ DÉDUPLICATION : Créer une référence unique SANS timestamp
            // Utiliser une fenêtre de 5 minutes pour la déduplication
            const timeWindow = Math.floor(Date.now() / (5 * 60 * 1000)); // 5 minutes
            const messageHash = Buffer.from(`${cleanPhoneNumber}_${message}_${timeWindow}`).toString('base64').substring(0, 16);
            const uniqueReference = `AI_${messageHash}`;
            
            // Vérifier si ce message a déjà été envoyé dans cette fenêtre de temps
            if (messageSent.has(uniqueReference)) {
                console.log('🛡️ DUPLICATA BLOQUÉ (Agent IA):', {
                    to: cleanPhoneNumber,
                    messagePreview: message.substring(0, 50) + '...',
                    uniqueReference,
                    timeWindow,
                    reason: 'Message identique dans la fenêtre de 5 minutes'
                });
                return;
            }
            
            // Marquer le message comme envoyé
            messageSent.add(uniqueReference);
            
            console.log('📤 Envoi du message WhatsApp (Agent IA):', {
                to: cleanPhoneNumber,
                messageLength: message.length,
                uniqueReference,
                timeWindow
            });

            const response = await axios.post(
                `${this.apiUrl}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: cleanPhoneNumber,
                    type: 'text',
                    text: {
                        preview_url: false,
                        body: `${message}\n\n_Ref: ${uniqueReference}_`
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Message envoyé avec succès (Agent IA):', {
                whatsappMessageId: response.data.messages?.[0]?.id,
                uniqueReference
            });
            
            // Nettoyer le cache après 10 minutes
            setTimeout(() => {
                messageSent.delete(uniqueReference);
                console.log('🧹 Cache nettoyé pour:', uniqueReference);
            }, 10 * 60 * 1000);

        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error('❌ Erreur lors de l\'envoi du message WhatsApp (Agent IA):', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
            } else {
                console.error('❌ Erreur inattendue lors de l\'envoi du message WhatsApp (Agent IA):', error);
            }
            throw error;
        }
    }
} 