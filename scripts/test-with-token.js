const https = require('https');
const http = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiODdiMjQxMWY1NzJlYzJmNDNmYWNhNjgwOGM0NTE4NTQiLCJ1c2VySWQiOiJjbWE2bDkxbHkwMDAwOWJlMTkwaWJ5bGhjIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsImhhYml0czp3cml0ZSIsInRhc2tzOndyaXRlIl0sImV4cCI6MTc1MDA5NjExOCwiaWF0IjoxNzQ5NDkxMzE4fQ.sRH6KvMHAV7LUhVfrtAcN9qis6k8eS1OWrBhO3eYAg8';

const BASE_URL = 'http://localhost:3000';

function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`🔗 Testing: ${url}`);

    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        
        try {
          const jsonData = JSON.parse(data);
          console.log(`   ✅ Success - Response received`);
          resolve({ 
            success: true, 
            status: res.statusCode, 
            data: jsonData 
          });
        } catch (parseError) {
          console.log(`   ⚠️  Non-JSON response: ${data.substring(0, 100)}...`);
          resolve({ 
            success: false, 
            status: res.statusCode, 
            error: 'Non-JSON response',
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      reject(error);
    });

    req.end();
  });
}

async function testDebugEndpoints() {
  console.log('🧪 === TEST ENDPOINTS DEBUG AVEC TOKEN API ===\n');

  const endpoints = [
    '/api/debug/quick-ids',
    '/api/debug/ids',
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

  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest(endpoint);
      results[endpoint] = result;
      
      if (result.success && result.data) {
        // Afficher des informations utiles
        if (result.data.quickIds) {
          console.log(`   📊 Quick IDs found:`, Object.keys(result.data.quickIds).length);
        }
        if (result.data.count !== undefined) {
          console.log(`   📊 Count: ${result.data.count}`);
        }
        if (result.data.ids) {
          console.log(`   📊 IDs: ${result.data.ids.length} items`);
        }
      }
      
      console.log();
    } catch (error) {
      results[endpoint] = { 
        success: false, 
        error: error.message 
      };
      console.log();
    }
  }

  // Résumé
  console.log('📊 === RÉSUMÉ DES TESTS ===');
  console.log('==========================');
  
  const successes = Object.entries(results).filter(([_, result]) => result.success);
  const failures = Object.entries(results).filter(([_, result]) => !result.success);
  
  console.log(`✅ Succès: ${successes.length}/${endpoints.length}`);
  if (successes.length > 0) {
    successes.forEach(([endpoint, _]) => {
      console.log(`   - ${endpoint}`);
    });
  }
  
  console.log(`\n❌ Échecs: ${failures.length}/${endpoints.length}`);
  if (failures.length > 0) {
    failures.forEach(([endpoint, result]) => {
      console.log(`   - ${endpoint}: ${result.status || 'N/A'} - ${result.error || 'Erreur inconnue'}`);
    });
  }

  return results;
}

async function main() {
  try {
    console.log('🔑 Token utilisé:', TOKEN.substring(0, 50) + '...');
    console.log();
    
    await testDebugEndpoints();
    
    console.log('\n💡 === CONCLUSIONS ===');
    console.log('=====================');
    console.log('Si tous les endpoints retournent des erreurs d\'auth avec ce token:');
    console.log('1. Vérifiez que le token n\'est pas expiré');
    console.log('2. Vérifiez que l\'authentification API fonctionne');
    console.log('3. Vérifiez les logs du serveur pour plus de détails');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { makeRequest, testDebugEndpoints }; 