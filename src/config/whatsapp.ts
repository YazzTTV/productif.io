import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration WhatsApp
export interface WhatsAppConfig {
    WHATSAPP_APP_ID: string;
    WHATSAPP_APP_SECRET: string;
    WHATSAPP_ACCESS_TOKEN: string;
    WHATSAPP_BUSINESS_ACCOUNT_ID: string;
    WHATSAPP_VERIFY_TOKEN: string;
    WHATSAPP_PHONE_NUMBER_ID: string;
}

export const whatsappConfig: WhatsAppConfig = {
    WHATSAPP_APP_ID: process.env.WHATSAPP_APP_ID || '1153538919291940',
    WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET || '0982719782da8a00ddde42febabbd060',
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || 'EAAQZAIzWE3CQBO0EbYKHunc3GIs3NeM2JZCTmSzZBGTKY1ASEGX3YTdQZBnZBxjNGX9oJjaweTIIp0rMvGTBerzfjTNdh30pQY3PZAD5qPiStA1VWc4QlxPh8EUPaG5GZBojIuh2SxOXEWKQKhOSONZAB79HHMmKZCNZArdB6LRVi2aZB6xAaiKwLRifCy7XicZCxvOESAZDZD',
    WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '3469681606499078',
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'ProductifWhatsApp2024',
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '589370880934492'
};

// URL de l'API WhatsApp
export const API_URL = `https://graph.facebook.com/v17.0/${whatsappConfig.WHATSAPP_PHONE_NUMBER_ID}`;

export default whatsappConfig; 