const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiN2NhNTczMjg1ZjU2YzQ3MmJmYmMxZjQyZmIzNGM3OWIiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsIm9iamVjdGl2ZXM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl19.V4Z8uAVz66vWatrdOh71AdVZMqZO5R1H7q4TTOZhMKo';

// Décode le token pour l'inspection
const [headerB64, payloadB64] = token.split('.');
const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

console.log('📋 Informations du token:');
console.log('Token ID:', payload.tokenId);
console.log('User ID:', payload.userId);
console.log('Scopes:', payload.scopes);

// Test avec différentes configurations
async function testToken() {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    try {
        console.log('\n🔍 Test avec www.productif.io:');
        const response = await axios.get('https://www.productif.io/api/test-token', { headers });
        console.log('✅ Succès:', response.data);
    } catch (error) {
        console.log('❌ Erreur:', error.response?.data || error.message);
        console.log('Status:', error.response?.status);
        console.log('Headers:', JSON.stringify(error.response?.headers, null, 2));
    }
}

testToken(); 