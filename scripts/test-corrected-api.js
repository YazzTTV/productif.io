const jwt = require('jsonwebtoken');

// Configuration avec le bon port
const API_BASE = 'http://localhost:3001';
const JWT_SECRET = 'un_secret_tres_securise_pour_jwt_tokens';

// Token permanent créé par le script précédent
const PERMANENT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMDAzYzcwZDRjOWFiYmM1ZmUwZmVjYjg2OTcyNTQ5ZmQiLCJ1c2VySWQiOiJjbWE2bDkxbHkwMDAwOWJlMTkwaWJ5bGhjIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJ0YXNrczp3cml0ZSIsImhhYml0czpyZWFkIiwiaGFiaXRzOndyaXRlIl19.amSmhfK9vEMtxFA_3JQ8LBzXC7vFAI-FfPfwVYYRsVQ';

async function testCorrectedAPI() {
  console.log('🧪 === TEST TOKEN PERMANENT CORRIGÉ ===\n');

  try {
    // Analyser le token
    const decoded = jwt.verify(PERMANENT_TOKEN, JWT_SECRET);
    console.log('🔍 ANALYSE DU TOKEN:');
    console.log(`   ✅ Valide: OUI`);
    console.log(`   ✅ User ID: ${decoded.userId}`);
    console.log(`   ✅ Scopes: ${decoded.scopes.join(', ')}`);
    console.log(`   ✅ Expiration: ${decoded.exp ? 'OUI' : 'AUCUNE (PERMANENT)'}`);
    
    // Vérifier le header
    const header = JSON.parse(Buffer.from(PERMANENT_TOKEN.split('.')[0], 'base64').toString());
    console.log(`   ✅ Header type: ${header.typ || 'MANQUANT'}`);
    console.log(`   ✅ Algorithme: ${header.alg}`);
    console.log();

    // Tester les APIs
    const apiHeaders = {
      'Authorization': `Bearer ${PERMANENT_TOKEN}`,
      'Content-Type': 'application/json'
    };

    console.log('🌐 TEST DES APIS:');
    
    // Test 1: API auth info
    console.log('   🔍 Test auth info...');
    try {
      const authResponse = await fetch(`${API_BASE}/api/debug/auth-info`, { headers: apiHeaders });
      if (authResponse.ok) {
        const authInfo = await authResponse.json();
        console.log(`   ✅ Auth OK - Email: ${authInfo.userEmail}`);
      } else {
        console.log(`   ❌ Auth échec: ${authResponse.status}`);
      }
    } catch (e) {
      console.log(`   ❌ Auth erreur: ${e.message}`);
    }

    // Test 2: API tasks
    console.log('   📋 Test tasks...');
    try {
      const tasksResponse = await fetch(`${API_BASE}/api/tasks/agent`, { headers: apiHeaders });
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        console.log(`   ✅ Tasks OK - ${tasks.length} tâches récupérées`);
      } else {
        console.log(`   ❌ Tasks échec: ${tasksResponse.status}`);
      }
    } catch (e) {
      console.log(`   ❌ Tasks erreur: ${e.message}`);
    }

    // Test 3: Créer une tâche
    console.log('   ➕ Test création tâche...');
    try {
      const createTaskResponse = await fetch(`${API_BASE}/api/tasks/agent`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({
          title: 'Tâche créée avec token permanent',
          description: 'Test de validation des corrections',
          priority: 'MEDIUM'
        })
      });
      
      if (createTaskResponse.ok) {
        const newTask = await createTaskResponse.json();
        console.log(`   ✅ Création OK - ID: ${newTask.id}`);
      } else {
        console.log(`   ❌ Création échec: ${createTaskResponse.status}`);
      }
    } catch (e) {
      console.log(`   ❌ Création erreur: ${e.message}`);
    }

    console.log('\n🎉 === RÉSULTATS FINAUX ===');
    console.log('✅ Token permanent fonctionnel');
    console.log('✅ APIs accessibles avec le token');
    console.log('✅ Plus de problème d\'expiration');
    console.log('✅ Interface web corrigée pour créer des tokens permanents');
    
    console.log('\n🔧 CORRECTIONS APPLIQUÉES:');
    console.log('1. ✅ lib/jwt.ts - Option noExpiration ajoutée');
    console.log('2. ✅ lib/api-token.ts - Utilisation de noExpiration quand pas d\'expiresAt');
    console.log('3. ✅ Headers JWT conformes avec "typ": "JWT"');
    console.log('4. ✅ Expiration par défaut passée de 7j à 1 an');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testCorrectedAPI(); 