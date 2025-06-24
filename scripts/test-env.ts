import * as dotenv from 'dotenv';
// Charger explicitement le fichier .env.local
dotenv.config({ path: '.env.local' });

console.log('=== Test des variables d\'environnement ===\n');

console.log('Variables WhatsApp:');
console.log('NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID:', process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID);
console.log('NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN:', process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN);

console.log('\nAutres variables:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'défini' : 'non défini');

console.log('\nEnvironnement Node:');
console.log('NODE_ENV:', process.env.NODE_ENV); 