import fetch from 'node-fetch';

// Configuration WhatsApp
const config = {
    WHATSAPP_APP_ID: '1153538919291940',
    WHATSAPP_APP_SECRET: '0982719782da8a00ddde42febabbd060',
    WHATSAPP_ACCESS_TOKEN: 'EAAQZAIzWE3CQBO0EbYKHunc3GIs3NeM2JZCTmSzZBGTKY1ASEGX3YTdQZBnZBxjNGX9oJjaweTIIp0rMvGTBerzfjTNdh30pQY3PZAD5qPiStA1VWc4QlxPh8EUPaG5GZBojIuh2SxOXEWKQKhOSONZAB79HHMmKZCNZArdB6LRVi2aZB6xAaiKwLRifCy7XicZCxvOESAZDZD',
    WHATSAPP_BUSINESS_ACCOUNT_ID: '3469681606499078',
    WHATSAPP_VERIFY_TOKEN: 'ProductifWhatsApp2024',
    WHATSAPP_PHONE_NUMBER_ID: '589370880934492'
};

async function sendTestMessage() {
    try {
        console.log('🚀 Envoi d\'un message de test WhatsApp...');

        const url = `https://graph.facebook.com/v17.0/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        console.log(`🔗 URL de l'API: ${url}`);

        const phoneNumber = '33783642205';
        const message = `🔔 *Test WhatsApp*\n\nCeci est un message de test direct!\n\nHeure: ${new Date().toLocaleTimeString('fr-FR')}\n\n_Si vous recevez ce message, la configuration est correcte!_`;

        console.log(`📱 Envoi à ${phoneNumber}:`);
        console.log(message);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: {
                    preview_url: false,
                    body: message
                }
            })
        });

        const responseText = await response.text();
        console.log(`📬 Réponse de l'API (${response.status}):`);
        console.log(responseText);

        if (!response.ok) {
            throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}\n${responseText}`);
        }

        console.log('✅ Message envoyé avec succès!');
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

sendTestMessage(); 