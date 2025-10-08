const whatsappService = require('../services/whatsappService');

async function testWhatsApp() {
    try {
        // Test d'envoi de message
        console.log('Test d\'envoi de message...');
        const response = await whatsappService.sendMessage(
            "+33783242840", // Format international complet
            "👋 Bonjour ! Ceci est un message test de l'API WhatsApp. Répondez à ce message pour tester la réception."
        );
        console.log('Message envoyé avec succès:', JSON.stringify(response, null, 2));
        
        console.log('\nPour tester la réception:');
        console.log('1. Vous devriez recevoir le message ci-dessus sur WhatsApp');
        console.log('2. Répondez au message sur WhatsApp');
        console.log('3. Votre réponse devrait être reçue par le webhook');
        console.log('\nLe serveur est en écoute sur le webhook:', process.env.WEBHOOK_URL || 'https://f55e-91-175-40-217.ngrok-free.app/webhook');
        
    } catch (error) {
        console.error('Erreur lors du test:', error.response?.data || error.message);
    }
}

testWhatsApp(); 