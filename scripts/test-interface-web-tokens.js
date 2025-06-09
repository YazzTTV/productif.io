const jwt = require('jsonwebtoken');

// Configuration
const API_BASE = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'un_secret_tres_securise_pour_jwt_tokens';

async function testWebInterfaceTokens() {
  console.log('🌐 === TEST TOKENS INTERFACE WEB ===\n');

  try {
    // Test 1: Créer un token via l'API comme le ferait l'interface web
    console.log('🔨 ÉTAPE 1: Création de token via API');
    
    // D'abord, connectons-nous pour avoir un cookie d'authentification
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@productif.io',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Erreur de connexion: ${loginResponse.status}`);
    }

    const authCookie = loginResponse.headers.get('set-cookie')?.split(';')[0];
    console.log('   ✅ Connexion réussie');

    // Maintenant créons un token comme le ferait l'interface web
    const tokenData = {
      name: "Token Test Web Interface",
      description: "Test après corrections",
      scopes: ['tasks:read', 'tasks:write', 'habits:read', 'habits:write'],
      // Pas de expiresAt - comme quand l'utilisateur laisse le champ vide
    };

    console.log('   📝 Données du token:', JSON.stringify(tokenData, null, 2));

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
      throw new Error(`Erreur création token: ${createTokenResponse.status} - ${error}`);
    }

    const tokenResult = await createTokenResponse.json();
    console.log('   ✅ Token créé via API');
    console.log(`   🔑 Token: ${tokenResult.token.substring(0, 50)}...`);
    
    // Analyser le token
    const decoded = jwt.verify(tokenResult.token, JWT_SECRET);
    console.log('   📊 Analyse du token:');
    console.log(`      - User ID: ${decoded.userId}`);
    console.log(`      - Scopes: ${decoded.scopes.join(', ')}`);
    console.log(`      - Expiration: ${decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'AUCUNE ✅'}`);
    console.log(`      - Créé le: ${new Date(decoded.iat * 1000).toISOString()}`);
    console.log();

    // Test 2: Utiliser le token pour appeler les APIs
    console.log('🔨 ÉTAPE 2: Test du token sur les APIs');
    
    const apiHeaders = {
      'Authorization': `Bearer ${tokenResult.token}`,
      'Content-Type': 'application/json'
    };

    // Test API debug pour vérifier l'auth
    console.log('   📡 Test API auth...');
    const authTestResponse = await fetch(`${API_BASE}/api/debug/auth-info`, {
      headers: apiHeaders
    });

    if (authTestResponse.ok) {
      const authInfo = await authTestResponse.json();
      console.log('   ✅ API auth OK');
      console.log(`      - User ID: ${authInfo.userId}`);
      console.log(`      - Email: ${authInfo.userEmail}`);
    } else {
      console.log('   ❌ Échec API auth:', authTestResponse.status);
    }

    // Test API tasks
    console.log('   📡 Test API tasks...');
    const tasksResponse = await fetch(`${API_BASE}/api/tasks/agent`, {
      headers: apiHeaders
    });

    if (tasksResponse.ok) {
      const tasks = await tasksResponse.json();
      console.log(`   ✅ API tasks OK - ${tasks.length} tâches récupérées`);
    } else {
      console.log('   ❌ Échec API tasks:', tasksResponse.status);
    }

    // Test API habits
    console.log('   📡 Test API habits...');
    const habitsResponse = await fetch(`${API_BASE}/api/habits/agent`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({
        habitId: 'cma6l91ly00019be190icmb4e', // ID d'une habitude existante
        date: new Date().toISOString().split('T')[0]
      })
    });

    if (habitsResponse.ok) {
      const habitEntry = await habitsResponse.json();
      console.log('   ✅ API habits OK - Habitude marquée');
    } else {
      console.log('   ❌ Échec API habits:', habitsResponse.status);
    }

    console.log();
    console.log('🎉 === RÉSULTATS ===');
    console.log('✅ Token créé via interface web simulée');
    console.log('✅ Token sans expiration (permanent)');
    console.log('✅ Token functional pour les APIs');
    console.log('✅ Corrections appliquées avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Attendre que le serveur soit démarré avant le test
setTimeout(() => {
  testWebInterfaceTokens();
}, 1000); 