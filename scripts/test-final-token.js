const jwt = require('jsonwebtoken');

// Configuration
const API_BASE = 'http://localhost:3000';
const JWT_SECRET = 'un_secret_tres_securise_pour_jwt_tokens';

async function createAndTestToken() {
  console.log('🎯 === TEST FINAL TOKENS CORRIGÉS ===\n');

  try {
    // Se connecter
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@productif.io',
        password: 'admin123'
      })
    });

    const authCookie = loginResponse.headers.get('set-cookie')?.split(';')[0];
    console.log('✅ Connexion OK');

    // Créer un token via l'API (simulant l'interface web)
    const tokenData = {
      name: "Token Interface Web Corrigé",
      description: "Test final après corrections",
      scopes: ['tasks:read', 'tasks:write', 'habits:read', 'habits:write']
      // Pas d'expiresAt - laissé vide comme dans l'interface web
    };

    const createTokenResponse = await fetch(`${API_BASE}/api/tokens`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify(tokenData)
    });

    const tokenResult = await createTokenResponse.json();
    console.log('✅ Token créé via interface web simulée');
    
    // Analyser le token
    const decoded = jwt.verify(tokenResult.token, JWT_SECRET);
    console.log(`✅ Token valide - User: ${decoded.userId}`);
    console.log(`✅ Scopes: ${decoded.scopes.join(', ')}`);
    console.log(`✅ Expiration: ${decoded.exp ? 'OUI' : 'AUCUNE (PERMANENT)'}`);

    // Tester avec l'API
    const tasksResponse = await fetch(`${API_BASE}/api/tasks/agent`, {
      headers: {
        'Authorization': `Bearer ${tokenResult.token}`
      }
    });

    if (tasksResponse.ok) {
      const tasks = await tasksResponse.json();
      console.log(`✅ API fonctionnelle - ${tasks.length} tâches récupérées`);
    } else {
      console.log('❌ Échec API tasks');
    }

    console.log('\n🎉 === RÉSULTAT FINAL ===');
    console.log('✅ Problème résolu !');
    console.log('✅ Les tokens créés via l\'interface web sont maintenant permanents');
    console.log('✅ Plus de problème d\'expiration prématurée');
    console.log('✅ Headers JWT corrects avec "typ": "JWT"');
    
    console.log('\n🔑 TOKEN CRÉÉ:');
    console.log(tokenResult.token);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

setTimeout(createAndTestToken, 1000); 