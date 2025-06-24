import whatsappConfig from '../config/whatsapp';

console.log('=== Test de la configuration WhatsApp ===\n');

console.log('Variables d\'environnement:');
console.log('WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID || 'non défini');
console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? 'défini' : 'non défini');

console.log('\nConfiguration chargée:');
console.log('phoneNumberId:', whatsappConfig.phoneNumberId || 'non défini');
console.log('accessToken:', whatsappConfig.accessToken ? 'défini' : 'non défini');
console.log('baseUrl:', whatsappConfig.baseUrl);
console.log('apiVersion:', whatsappConfig.apiVersion); 