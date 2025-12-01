import axios, { AxiosError } from 'axios';

interface MessageCache {
    [key: string]: number; // key = hash du message, value = timestamp
}

export class WhatsAppService {
    private apiUrl: string;
    private accessToken: string;
    private phoneNumberId: string;
    private messageCache: MessageCache = {};
    private readonly DEDUP_WINDOW_MS = 60000; // 1 minute
    private readonly REQUEST_TIMEOUT_MS = 30000; // 30 secondes
    private readonly MAX_RETRIES = 3;

    constructor() {
        // Utiliser une valeur par défaut si non fournie pour éviter un crash au démarrage
        if (!process.env.WHATSAPP_API_URL) {
            console.warn('WHATSAPP_API_URL is not defined, defaulting to https://graph.facebook.com/v17.0');
        }
        if (!process.env.WHATSAPP_ACCESS_TOKEN) {
            throw new Error('WHATSAPP_ACCESS_TOKEN is not defined');
        }
        if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
            throw new Error('WHATSAPP_PHONE_NUMBER_ID is not defined');
        }

        this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        // Nettoyer le cache périodiquement (toutes les 5 minutes)
        setInterval(() => this.cleanMessageCache(), 300000);
    }

    /**
     * Génère un hash simple pour la déduplication des messages
     */
    private generateMessageHash(to: string, message: string): string {
        return `${to}:${message.substring(0, 100)}`;
    }

    /**
     * Vérifie si un message identique a été envoyé récemment
     */
    private isDuplicate(to: string, message: string): boolean {
        const hash = this.generateMessageHash(to, message);
        const lastSent = this.messageCache[hash];
        const now = Date.now();

        if (lastSent && (now - lastSent) < this.DEDUP_WINDOW_MS) {
            return true;
        }

        this.messageCache[hash] = now;
        return false;
    }

    /**
     * Nettoie les entrées expirées du cache
     */
    private cleanMessageCache(): void {
        const now = Date.now();
        Object.keys(this.messageCache).forEach(key => {
            if (now - this.messageCache[key] > this.DEDUP_WINDOW_MS) {
                delete this.messageCache[key];
            }
        });
    }

    /**
     * Attendre avec délai (pour le backoff exponentiel)
     */
    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Détermine si l'erreur est réessayable
     */
    private isRetryableError(error: AxiosError): boolean {
        // Réessayer sur les erreurs de réseau ou timeouts
        if (!error.response) {
            return true; // Erreurs réseau (ETIMEDOUT, ECONNREFUSED, etc.)
        }

        // Réessayer sur certains codes HTTP
        const status = error.response.status;
        return status === 429 || status >= 500;
    }

    /**
     * Envoie un message WhatsApp avec retry et déduplication
     */
    async sendMessage(to: string, message: string): Promise<void> {
        const cleanPhoneNumber = to.replace(/\D/g, '');

        // Vérifier la déduplication
        if (this.isDuplicate(cleanPhoneNumber, message)) {
            console.log('⚠️ Message en double détecté et ignoré:', {
                to: cleanPhoneNumber,
                messagePreview: message.substring(0, 50) + '...'
            });
            return;
        }

        console.log('📤 Envoi du message WhatsApp (Agent IA):', {
            to: cleanPhoneNumber,
            messageLength: message.length
        });

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
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
                        },
                        timeout: this.REQUEST_TIMEOUT_MS
                    }
                );

                console.log('✅ Message envoyé avec succès (Agent IA):', {
                    whatsappMessageId: response.data.messages?.[0]?.id,
                    attempt
                });

                return; // Succès !

            } catch (error: unknown) {
                lastError = error as Error;

                if (axios.isAxiosError(error)) {
                    const errorDetails = {
                        attempt,
                        maxRetries: this.MAX_RETRIES,
                        status: error.response?.status,
                        code: error.code,
                        message: error.message,
                        data: error.response?.data
                    };

                    // Vérifier si on doit réessayer
                    const shouldRetry = attempt < this.MAX_RETRIES && this.isRetryableError(error);

                    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                        console.error(`⏱️ Timeout lors de l'envoi du message WhatsApp:`, errorDetails);
                    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                        console.error(`🔌 Erreur de connexion réseau:`, errorDetails);
                    } else if (error.response?.status === 429) {
                        console.error(`🚦 Rate limit atteint:`, errorDetails);
                    } else {
                        console.error(`❌ Erreur lors de l'envoi du message WhatsApp:`, errorDetails);
                    }

                    if (shouldRetry) {
                        // Backoff exponentiel : 1s, 2s, 4s
                        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                        console.log(`🔄 Nouvelle tentative dans ${delayMs}ms...`);
                        await this.sleep(delayMs);
                    } else {
                        break; // Ne pas réessayer
                    }
                } else {
                    console.error('❌ Erreur inattendue lors de l\'envoi du message WhatsApp:', error);
                    break; // Ne pas réessayer sur les erreurs inattendues
                }
            }
        }

        // Si on arrive ici, toutes les tentatives ont échoué
        console.error(`❌ Échec définitif après ${this.MAX_RETRIES} tentatives`);
        throw new Error(`Impossible d'envoyer le message WhatsApp après ${this.MAX_RETRIES} tentatives: ${lastError?.message}`);
    }
} 