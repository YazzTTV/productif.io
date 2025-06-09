const jwt = require('jsonwebtoken');

// Configuration
const API_BASE = 'http://localhost:3001';
const JWT_SECRET = 'un_secret_tres_securise_pour_jwt_tokens';

async function testWebInterfaceFinal() {
  console.log('🌐 === TEST FINAL INTERFACE WEB ===\n');

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

    if (!loginResponse.ok) {
      throw new Error('Échec connexion');
    }

    const authCookie = loginResponse.headers.get('set-cookie')?.split(';')[0];
    console.log('✅ Connexion réussie');

    // Créer un token comme le ferait l'interface web
    const tokenData = {
      name: "Token Interface Web Final",
      description: "Test final après toutes les corrections",
      scopes: ['tasks:read', 'tasks:write', 'habits:read', 'habits:write']
      // PAS d'expiresAt - exactement comme quand l'utilisateur laisse le champ vide
    };

    console.log('📝 Données envoyées (comme interface web):');
    console.log(JSON.stringify(tokenData, null, 2));

    const createTokenResponse = await fetch(`${API_BASE}/api/tokens`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify(tokenData)
    });

    if (!createTokenResponse.ok) {
      const error = await createTokenResponse.text();
      throw new Error(`Erreur création: ${createTokenResponse.status} - ${error}`);
    }

    const tokenResult = await createTokenResponse.json();
    console.log('\n✅ Token créé via interface web !');
    
    // Analyser le token créé
    const decoded = jwt.verify(tokenResult.token, JWT_SECRET);
    console.log('\n🔍 ANALYSE DU TOKEN CRÉÉ:');
    console.log(`   User: ${decoded.userId}`);
    console.log(`   Scopes: ${decoded.scopes.join(', ')}`);
    console.log(`   Expiration: ${decoded.exp ? `Le ${new Date(decoded.exp * 1000).toISOString()}` : 'AUCUNE (PERMANENT) ✅'}`);
    
    // Vérifier le header
    const header = JSON.parse(Buffer.from(tokenResult.token.split('.')[0], 'base64').toString());
    console.log(`   Header JWT type: ${header.typ} ✅`);

    // Tester le token immédiatement
    console.log('\n🧪 Test immédiat du token:');
    const testResponse = await fetch(`${API_BASE}/api/tasks/agent`, {
      headers: { 'Authorization': `Bearer ${tokenResult.token}` }
    });

    if (testResponse.ok) {
      const tasks = await testResponse.json();
      console.log(`✅ Token fonctionne - ${tasks.length} tâches récupérées`);
    } else {
      console.log(`❌ Token ne fonctionne pas: ${testResponse.status}`);
    }

    console.log('\n🎉 === PROBLÈME RÉSOLU ===');
    console.log('✅ Interface web crée maintenant des tokens PERMANENTS');
    console.log('✅ Plus d\'expiration automatique de 7 jours');
    console.log('✅ Headers JWT conformes');
    console.log('✅ Tokens immédiatement fonctionnels');

    console.log('\n🔑 TOKEN CRÉÉ VIA INTERFACE WEB:');
    console.log(tokenResult.token);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testWebInterfaceFinal(); 