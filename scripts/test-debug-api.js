const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

const TEST_TYPES = [
  'tasks', 'habits', 'habit-entries', 'projects', 'missions', 
  'objectives', 'actions', 'processes', 'time-entries',
  'achievements', 'user-achievements'
];

async function testEndpoint(url, options = {}) {
  try {
    console.log(`📡 Test: ${url}`);
    const response = await fetch(url, options);
    const data = await response.text();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status !== 200) {
      console.log(`   Erreur: ${data}`);
      return { success: false, status: response.status, error: data };
    }
    
    try {
      const jsonData = JSON.parse(data);
      console.log(`   ✅ Succès - Données reçues (${Object.keys(jsonData).length} clés)`);
      return { success: true, status: response.status, data: jsonData };
    } catch (parseError) {
      console.log(`   ⚠️  Réponse non-JSON: ${data.substring(0, 100)}...`);
      return { success: false, status: response.status, error: 'Non-JSON response' };
    }
    
  } catch (error) {
    console.log(`   ❌ Erreur réseau: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testBasicEndpoints() {
  console.log('🔍 === TEST ENDPOINTS DEBUG BASIQUES ===\n');
  
  // Test endpoint principal
  await testEndpoint(`${BASE_URL}/api/debug/ids`);
  console.log();
  
  // Test endpoint quick-ids
  await testEndpoint(`${BASE_URL}/api/debug/quick-ids`);
  console.log();
}

async function testTypeEndpoints() {
  console.log('🔍 === TEST ENDPOINTS DEBUG PAR TYPE ===\n');
  
  const results = {};
  
  for (const type of TEST_TYPES) {
    const result = await testEndpoint(`${BASE_URL}/api/debug/ids/${type}`);
    results[type] = result;
    console.log();
  }
  
  // Résumé
  console.log('📊 === RÉSUMÉ DES TESTS ===');
  console.log('==========================');
  
  const successes = Object.entries(results).filter(([_, result]) => result.success);
  const failures = Object.entries(results).filter(([_, result]) => !result.success);
  
  console.log(`✅ Succès: ${successes.length}/${TEST_TYPES.length}`);
  if (successes.length > 0) {
    successes.forEach(([type, _]) => {
      console.log(`   - ${type}`);
    });
  }
  
  console.log(`❌ Échecs: ${failures.length}/${TEST_TYPES.length}`);
  if (failures.length > 0) {
    failures.forEach(([type, result]) => {
      console.log(`   - ${type}: ${result.status || 'N/A'} - ${result.error || 'Erreur inconnue'}`);
    });
  }
  
  return results;
}

async function testWithMockAuth() {
  console.log('🔍 === TEST AVEC TENTATIVE D\'AUTH FACTICE ===\n');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token',
    'Cookie': 'next-auth.session-token=mock-session'
  };
  
  await testEndpoint(`${BASE_URL}/api/debug/ids/tasks`, { headers });
  console.log();
}

async function checkServerStatus() {
  console.log('🌐 === VÉRIFICATION STATUT SERVEUR ===\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/session`);
    console.log(`📡 Serveur Next.js: ${response.status === 200 ? '✅ En ligne' : '❌ Problème'}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`📊 Session auth: ${data.user ? '✅ Utilisateur connecté' : '❌ Non connecté'}`);
    }
  } catch (error) {
    console.log(`❌ Serveur Next.js: Hors ligne (${error.message})`);
    console.log('💡 Lancez d\'abord: npm run dev');
    return false;
  }
  
  console.log();
  return true;
}

async function main() {
  console.log('🧪 === TEST COMPLET ENDPOINT DEBUG/IDS/[TYPE] ===\n');
  
  // Vérifier que le serveur est en ligne
  const serverOnline = await checkServerStatus();
  if (!serverOnline) {
    process.exit(1);
  }
  
  // Test des endpoints basiques
  await testBasicEndpoints();
  
  // Test des endpoints par type
  const results = await testTypeEndpoints();
  
  // Test avec auth factice
  await testWithMockAuth();
  
  // Recommandations finales
  console.log('\n💡 === RECOMMANDATIONS ===');
  console.log('========================');
  
  const hasAuthErrors = Object.values(results).some(r => 
    r.error && (r.error.includes('authentifié') || r.status === 401)
  );
  
  if (hasAuthErrors) {
    console.log('🔐 Problème d\'authentification détecté:');
    console.log('   1. Connectez-vous sur l\'app web: http://localhost:3000/login');
    console.log('   2. Ou créez un token API dans les paramètres');
    console.log('   3. Ou utilisez l\'endpoint sans auth si disponible');
  }
  
  const hasServerErrors = Object.values(results).some(r => 
    r.status === 500 || (r.error && r.error.includes('Error'))
  );
  
  if (hasServerErrors) {
    console.log('🐛 Erreurs serveur détectées:');
    console.log('   1. Vérifiez les logs du serveur Next.js');
    console.log('   2. Vérifiez la connexion à la base de données');
    console.log('   3. Régénérez le client Prisma si nécessaire');
  }
}

// Gestion de node-fetch pour les anciens environnements
if (typeof fetch === 'undefined') {
  console.log('📦 Installation de node-fetch requise...');
  console.log('Exécutez: npm install node-fetch@2');
  process.exit(1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  });
}

module.exports = { testEndpoint, testTypeEndpoints, checkServerStatus }; 