import { jwtVerify } from 'jose';
import { TextEncoder } from 'util';
import jwt from 'jsonwebtoken';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiYmE5ZWU5N2VkOGY2NTI1NGMyODNkNGZkMmVjY2M4OGMiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl19.qSw_5cfWLz1lhqnXM03qbO12aMZ1w1ij4SPUFVINs6Q';

// Décodage sans vérification pour voir le contenu
console.log('\n🔍 Contenu du token (sans vérification):');
const decoded = jwt.decode(token);
console.log(JSON.stringify(decoded, null, 2));

// Test avec différentes clés secrètes
const secretsToTest = [
    process.env.JWT_SECRET || 'un_secret_tres_securise_pour_jwt_tokens',
    'your-256-bit-secret',
    'un_secret_tres_securise_pour_jwt_token', // Sans le 's' final
    process.env.API_TOKEN_SECRET || 'default_api_token_secret', // Valeur par défaut si undefined
];

console.log('\n🔑 Test avec différentes clés secrètes (utilisant jose):');

async function testSecrets() {
    for (const [index, secret] of secretsToTest.entries()) {
        try {
            console.log(`\nTest #${index + 1} avec secret: ${secret}`);
            const secretBytes = new TextEncoder().encode(secret);
            const { payload } = await jwtVerify(token, secretBytes);
            console.log('✅ Token vérifié avec succès !');
            console.log('Contenu vérifié:', JSON.stringify(payload, null, 2));
        } catch (error: any) {
            console.log('❌ Échec de la vérification:', error.code || error.message);
        }
    }
}

testSecrets(); 