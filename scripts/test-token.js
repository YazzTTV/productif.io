import axios from 'axios';

async function testToken() {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiOThlMGNlYTJkNDc1MTIwMTc2YzY5ODAxNjIxMDJkZjAiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsIm9iamVjdGl2ZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl19.IB-38Z-XdudfNOdkxEGmzq_F_KpxS4eXS1BfLchUgYE';
    const baseUrl = 'https://productif.io';
    
    console.log('🔑 Test du token:', token.substring(0, 20) + '...');
    
    // Décoder le token JWT (partie payload)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('📝 Contenu du token:', JSON.stringify(payload, null, 2));
    
    try {
        // Test avec le token sur /api/test-token
        console.log('\n🔒 Test de la route /api/test-token...');
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        console.log('📤 Configuration de la requête:', JSON.stringify(config, null, 2));
        
        const response = await axios.get(`${baseUrl}/api/test-token`, config);

        console.log('✅ Token valide!');
        console.log('📝 Réponse:', JSON.stringify(response.data, null, 2));
        
        // Test des habitudes
        console.log('\n🔒 Test de la route /api/habits/agent...');
        const habitsResponse = await axios.get(`${baseUrl}/api/habits/agent`, config);
        console.log('✅ Accès aux habitudes réussi!');
        console.log('📝 Réponse:', JSON.stringify(habitsResponse.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.error('❌ Erreur:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
            console.error('Request URL:', error.config.url);
            console.error('Request Headers:', error.config.headers);
        } else {
            console.error('❌ Erreur:', error.message);
        }
    }
}

testToken(); 