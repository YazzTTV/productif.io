import whatsappService from '../src/services/WhatsAppService.ts';

async function sendTestMessage() {
    try {
        console.log('🚀 Envoi d\'un message de test WhatsApp...');

        const phoneNumber = '33783642205';
        const message = `🔔 *Test WhatsApp*\n\nCeci est un message de test!\n\nHeure: ${new Date().toLocaleTimeString('fr-FR')}\n\n_Si vous recevez ce message, la configuration est correcte!_`;

        await whatsappService.sendMessage(phoneNumber, message);
        
        console.log('✅ Message envoyé avec succès!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

sendTestMessage(); 