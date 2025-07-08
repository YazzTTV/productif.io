import axios from 'axios';

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
            
            console.log('📤 Envoi du message WhatsApp (Agent IA):', {
                to: cleanPhoneNumber,
                messageLength: message.length
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
                        body: message
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
                whatsappMessageId: response.data.messages?.[0]?.id
            });

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