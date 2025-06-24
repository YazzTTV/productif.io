interface WhatsAppConfig {
    phoneNumberId: string | undefined;
    accessToken: string | undefined;
}

export const whatsappConfig: WhatsAppConfig = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
};

// Fonction pour vérifier la configuration
export function validateWhatsAppConfig() {
    const requiredFields = ['phoneNumberId', 'accessToken'] as const;
    const missingFields = requiredFields.filter(field => !whatsappConfig[field]);
    
    if (missingFields.length > 0) {
        throw new Error(
            `Configuration WhatsApp incomplète. Variables manquantes : ${missingFields.join(', ')}`
        );
    }
} 