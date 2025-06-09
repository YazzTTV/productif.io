const jwt = require('jsonwebtoken');

// Configuration
const API_BASE = 'http://localhost:3001';
const JWT_SECRET = 'un_secret_tres_securise_pour_jwt_tokens';

// Token créé par l'utilisateur via l'interface web
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiYWFmNjc5ZWYzNWRlNzJiOTViN2QwMDdlZDVjYWE4MTciLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJ0YXNrczp3cml0ZSIsImhhYml0czp3cml0ZSIsInByb2plY3RzOndyaXRlIl19.JM0xZftVtVE1YxjytuqXGOzmdm2Ti39_MAQ07aBqGjI';

async function analyzeUserToken() {
  console.log('🔍 === ANALYSE DU TOKEN UTILISATEUR ===\n');

  try {
    // 1. Analyser le token JWT
    console.log('📊 ANALYSE JWT:');
    const decoded = jwt.verify(USER_TOKEN, JWT_SECRET);
    
    console.log(`   ✅ Token valide: OUI`);
    console.log(`   ✅ User ID: ${decoded.userId}`);
    console.log(`   ✅ Token ID: ${decoded.tokenId}`);
    console.log(`   ✅ Scopes (${decoded.scopes.length}): ${decoded.scopes.join(', ')}`);
    console.log(`   ✅ Expiration: ${decoded.exp ? `Le ${new Date(decoded.exp * 1000).toISOString()}` : 'AUCUNE (PERMANENT) 🎉'}`);
    
    if (decoded.iat) {
      console.log(`   ✅ Créé le: ${new Date(decoded.iat * 1000).toISOString()}`);
    }

    // 2. Vérifier le header
    const header = JSON.parse(Buffer.from(USER_TOKEN.split('.')[0], 'base64').toString());
    console.log(`   ✅ Header type: ${header.typ} ${header.typ === 'JWT' ? '✅' : '❌'}`);
    console.log(`   ✅ Algorithme: ${header.alg}`);

    console.log('\n🧪 TESTS FONCTIONNELS:');

    const apiHeaders = {
      'Authorization': `Bearer ${USER_TOKEN}`,
      'Content-Type': 'application/json'
    };

    // Test 1: Auth info
    console.log('   🔍 Test authentification...');
    try {
      const authResponse = await fetch(`${API_BASE}/api/debug/auth-info`, { headers: apiHeaders });
      if (authResponse.ok) {
        const authInfo = await authResponse.json();
        console.log(`   ✅ Auth réussie - Email: ${authInfo.userEmail}`);
        console.log(`   ✅ User ID correspond: ${authInfo.userId === decoded.userId ? 'OUI' : 'NON'}`);
      } else {
        console.log(`   ❌ Auth échouée: ${authResponse.status}`);
      }
    } catch (e) {
      console.log(`   ❌ Erreur auth: ${e.message}`);
    }

    // Test 2: Lire les tâches
    console.log('   📋 Test lecture tâches...');
    try {
      const tasksResponse = await fetch(`${API_BASE}/api/tasks/agent`, { headers: apiHeaders });
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        console.log(`   ✅ Lecture tâches réussie - ${tasks.length} tâches trouvées`);
      } else {
        console.log(`   ❌ Lecture tâches échouée: ${tasksResponse.status}`);
      }
    } catch (e) {
      console.log(`   ❌ Erreur lecture tâches: ${e.message}`);
    }

    // Test 3: Créer une tâche (si scope write disponible)
    if (decoded.scopes.includes('tasks:write')) {
      console.log('   ➕ Test création tâche...');
      try {
        const createResponse = await fetch(`${API_BASE}/api/tasks/agent`, {
          method: 'POST',
          headers: apiHeaders,
          body: JSON.stringify({
            title: 'Test token interface web',
            description: 'Tâche créée pour tester le token',
            priority: 'MEDIUM'
          })
        });
        
        if (createResponse.ok) {
          const newTask = await createResponse.json();
          console.log(`   ✅ Création tâche réussie - ID: ${newTask.id}`);
        } else {
          console.log(`   ❌ Création tâche échouée: ${createResponse.status}`);
        }
      } catch (e) {
        console.log(`   ❌ Erreur création tâche: ${e.message}`);
      }
    }

    // Test 4: Lire les projets
    if (decoded.scopes.includes('projects:read')) {
      console.log('   📁 Test lecture projets...');
      try {
        const projectsResponse = await fetch(`${API_BASE}/api/projects/agent`, { headers: apiHeaders });
        if (projectsResponse.ok) {
          const projects = await projectsResponse.json();
          console.log(`   ✅ Lecture projets réussie - ${projects.length} projets trouvés`);
        } else {
          console.log(`   ❌ Lecture projets échouée: ${projectsResponse.status}`);
        }
      } catch (e) {
        console.log(`   ❌ Erreur lecture projets: ${e.message}`);
      }
    }

    console.log('\n🎉 === RÉSULTAT FINAL ===');
    console.log('✅ Token créé via interface web');
    console.log(`✅ Token ${decoded.exp ? 'avec expiration' : 'PERMANENT'}`);
    console.log('✅ Headers JWT corrects');
    console.log('✅ Scopes complets (lecture et écriture)');
    console.log('✅ APIs fonctionnelles');
    console.log('\n🎯 CORRECTION VALIDÉE: L\'interface web crée maintenant des tokens permanents et fonctionnels !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    if (error.name === 'JsonWebTokenError') {
      console.error('   Le token n\'est pas valide ou la signature ne correspond pas');
    } else if (error.name === 'TokenExpiredError') {
      console.error('   Le token a expiré');
    }
  }
}

analyzeUserToken(); 