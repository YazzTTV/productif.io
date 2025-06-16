const http = require('http');

// Token de Noah (noah.lugagne@free.fr)
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0b2tlbklkIjoiZWZmODAwMTk4ZmYwMzlmOTNmZDcyMjQ0YWMyZDcwMWIiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJoYWJpdHM6d3JpdGUiLCJ0YXNrczp3cml0ZSIsInByb2plY3RzOndyaXRlIiwib2JqZWN0aXZlczp3cml0ZSIsInByb2Nlc3Nlczp3cml0ZSIsInByb2Nlc3NlczpyZWFkIl0sImV4cCI6MTc1MDA5NjYwNn0.jg0J-ILZsbuKzhHxxV730Lh122ohooLYERHj8U69yKU';

// Fonction utilitaire pour faire une requête HTTP
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            success: res.statusCode === 200,
            status: res.statusCode,
            data: jsonData,
            rawData: responseData
          });
        } catch (parseError) {
          resolve({
            success: false,
            status: res.statusCode,
            error: 'Non-JSON response',
            rawData: responseData.substring(0, 200)
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test des APIs Debug
async function testDebugAPIs() {
  console.log('🔍 === TEST DES APIs DEBUG ===\n');
  
  const debugEndpoints = [
    '/api/debug/ids/tasks',
    '/api/debug/ids/habits',
    '/api/debug/ids/habit-entries',
    '/api/debug/ids/projects',
    '/api/debug/ids/missions',
    '/api/debug/ids/objectives',
    '/api/debug/ids/actions',
    '/api/debug/ids/processes',
    '/api/debug/ids/time-entries',
    '/api/debug/ids/achievements',
    '/api/debug/ids/user-achievements'
  ];

  const results = {};

  for (const endpoint of debugEndpoints) {
    console.log(`🔗 Testing ${endpoint}...`);
    const result = await makeRequest(endpoint);
    
    results[endpoint] = result;
    
    if (result.success) {
      console.log(`   ✅ Status: ${result.status}`);
      if (result.data.count !== undefined) {
        console.log(`   📊 Count: ${result.data.count}`);
      }
      if (result.data.ids) {
        console.log(`   📊 IDs: ${result.data.ids.length} items`);
      }
    } else {
      console.log(`   ❌ Status: ${result.status} - ${result.data?.error || result.error}`);
    }
    console.log();
  }

  return results;
}

// Test des APIs Agent
async function testAgentAPIs() {
  console.log('🤖 === TEST DES APIs AGENT ===\n');
  
  const agentEndpoints = [
    '/api/habits/agent',
    '/api/tasks/agent', 
    '/api/tasks/agent/date?date=2025-06-09',
    '/api/projects/agent',
    '/api/processes/agent',
    '/api/test-token'
  ];

  const results = {};

  for (const endpoint of agentEndpoints) {
    console.log(`🔗 Testing ${endpoint}...`);
    const result = await makeRequest(endpoint);
    
    results[endpoint] = result;
    
    if (result.success) {
      console.log(`   ✅ Status: ${result.status}`);
      
      // Affichage spécifique selon le type de données
      if (Array.isArray(result.data)) {
        console.log(`   📊 Array with ${result.data.length} items`);
        if (result.data.length > 0) {
          const firstItem = result.data[0];
          if (firstItem.title) console.log(`   📝 First: ${firstItem.title}`);
          if (firstItem.name) console.log(`   📝 First: ${firstItem.name}`);
        }
      } else if (result.data.success !== undefined) {
        console.log(`   📊 Success: ${result.data.success}`);
        if (result.data.message) console.log(`   💬 Message: ${result.data.message}`);
      } else if (result.data.quickIds) {
        console.log(`   📊 Quick IDs: ${Object.keys(result.data.quickIds).length} items`);
      } else {
        console.log(`   📊 Response keys: ${Object.keys(result.data).length}`);
      }
    } else {
      console.log(`   ❌ Status: ${result.status} - ${result.data?.error || result.error}`);
    }
    console.log();
  }

  return results;
}

// Test de création d'entités
async function testCreationAPIs() {
  console.log('🔨 === TEST DE CRÉATION D\'ENTITÉS ===\n');
  
  const creationTests = [
    {
      endpoint: '/api/habits/agent',
      method: 'POST',
      data: {
        name: `Habitude de test ${new Date().toLocaleTimeString('fr-FR')}`,
        description: 'Habitude créée via API test',
        frequency: 'daily',
        color: '#3B82F6'
      },
      description: 'Création d\'une habitude'
    },
    {
      endpoint: '/api/tasks/agent',
      method: 'POST', 
      data: {
        title: `Tâche API test ${new Date().toLocaleTimeString('fr-FR')}`,
        description: 'Tâche créée pour tester l\'API',
        priority: 1,
        energyLevel: 2
      },
      description: 'Création d\'une tâche'
    },
    {
      endpoint: '/api/projects/agent',
      method: 'POST',
      data: {
        name: `Projet test ${new Date().toLocaleTimeString('fr-FR')}`,
        description: 'Projet créé via API test',
        color: '#10B981'
      },
      description: 'Création d\'un projet'
    },
    {
      endpoint: '/api/processes/agent',
      method: 'POST',
      data: {
        name: `Processus test ${new Date().toLocaleTimeString('fr-FR')}`,
        description: 'Processus créé via API test'
      },
      description: 'Création d\'un processus'
    }
  ];

  const results = {};

  for (const test of creationTests) {
    console.log(`🔗 ${test.description}: ${test.endpoint}...`);
    const result = await makeRequest(test.endpoint, test.method, test.data);
    
    results[test.endpoint] = result;
    
    if (result.success) {
      console.log(`   ✅ Status: ${result.status}`);
      if (result.data.id) {
        console.log(`   🆔 ID créé: ${result.data.id}`);
      }
      if (result.data.name) {
        console.log(`   📝 Nom: ${result.data.name}`);
      }
      if (result.data.title) {
        console.log(`   📝 Titre: ${result.data.title}`);
      }
    } else {
      console.log(`   ❌ Status: ${result.status} - ${result.data?.error || result.error}`);
    }
    console.log();
  }

  return results;
}

// Résumé général
async function generateSummary(debugResults, agentResults, creationResults) {
  console.log('📊 === RÉSUMÉ COMPLET ===\n');
  
  const allResults = { ...debugResults, ...agentResults, ...creationResults };
  const total = Object.keys(allResults).length;
  const successes = Object.values(allResults).filter(r => r.success).length;
  const failures = total - successes;
  
  console.log(`🎯 Total des tests: ${total}`);
  console.log(`✅ Succès: ${successes}`);
  console.log(`❌ Échecs: ${failures}`);
  console.log(`📈 Taux de réussite: ${Math.round((successes / total) * 100)}%\n`);
  
  console.log('📋 === DÉTAILS DES RÉSULTATS ===');
  console.log('================================');
  
  // APIs Debug
  console.log('\n🔍 APIs Debug:');
  Object.entries(debugResults).forEach(([endpoint, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${endpoint}`);
  });
  
  // APIs Agent
  console.log('\n🤖 APIs Agent:');
  Object.entries(agentResults).forEach(([endpoint, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${endpoint}`);
  });
  
  // APIs Création
  console.log('\n🔨 APIs Création:');
  Object.entries(creationResults).forEach(([endpoint, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${endpoint}`);
  });
  
  // Échecs détaillés
  const failedTests = Object.entries(allResults).filter(([_, result]) => !result.success);
  if (failedTests.length > 0) {
    console.log('\n❌ === ÉCHECS DÉTAILLÉS ===');
    failedTests.forEach(([endpoint, result]) => {
      console.log(`\n📍 ${endpoint}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Erreur: ${result.data?.error || result.error}`);
    });
  }
  
  console.log('\n🎉 === TESTS TERMINÉS ===');
  console.log('=========================');
  console.log('Token utilisé:', TOKEN.substring(0, 50) + '...');
  console.log('Date:', new Date().toLocaleString('fr-FR'));
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 === TEST COMPLET DE TOUTES LES APIs ===');
  console.log('==========================================\n');
  
  try {
    const debugResults = await testDebugAPIs();
    const agentResults = await testAgentAPIs();
    const creationResults = await testCreationAPIs();
    
    await generateSummary(debugResults, agentResults, creationResults);
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécuter tous les tests
runAllTests(); 