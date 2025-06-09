const http = require('http');

// Test sans token d'abord pour voir l'état de l'application
async function testDebugEndpoint() {
  console.log('🔗 Testing /api/debug/quick-ids (sans token)...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/debug/quick-ids',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data.substring(0, 500)}${data.length > 500 ? '...' : ''}`);
        
        if (res.statusCode === 401) {
          console.log('ℹ️ Comme attendu - authentification requise');
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      resolve();
    });

    req.end();
  });
}

// Test de création de token temporaire via l'endpoint de test
async function testTokenCreation() {
  console.log('\n🔗 Testing token creation endpoint...');
  
  // Essayons d'abord de voir s'il y a un endpoint de création de token de test
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/session',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data.substring(0, 300)}${data.length > 300 ? '...' : ''}`);
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      resolve();
    });

    req.end();
  });
}

// Test simple pour voir les endpoints disponibles
async function testRootApi() {
  console.log('\n🔗 Testing /api (root endpoint)...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data.substring(0, 300)}${data.length > 300 ? '...' : ''}`);
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      resolve();
    });

    req.end();
  });
}

async function runDiagnosticTests() {
  console.log('🔍 === TESTS DIAGNOSTIQUES ===\n');
  
  await testDebugEndpoint();
  await testTokenCreation();
  await testRootApi();
  
  console.log('\n💡 Pour créer une tâche, vous devez d\'abord:');
  console.log('1. Vous connecter à http://localhost:3000');
  console.log('2. Aller dans Paramètres > Tokens API');
  console.log('3. Créer un nouveau token avec les scopes "tasks:read" et "tasks:write"');
  console.log('4. Utiliser ce token dans le script test-create-task.js');
}

runDiagnosticTests(); 