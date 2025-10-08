const axios = require('axios');
const whatsappConfig = require('../config/whatsapp');

async function getPhoneNumberId() {
    try {
        const response = await axios.get(
            `${whatsappConfig.baseUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.businessAccountId}/phone_numbers`,
            {
                headers: {
                    'Authorization': `Bearer ${whatsappConfig.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Réponse de l\'API:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Erreur:', error.response?.data || error.message);
    }
}

getPhoneNumberId(); 