const http = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiODdiMjQxMWY1NzJlYzJmNDNmYWNhNjgwOGM0NTE4NTQiLCJ1c2VySWQiOiJjbWE2bDkxbHkwMDAwOWJlMTkwaWJ5bGhjIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsImhhYml0czp3cml0ZSIsInRhc2tzOndyaXRlIl0sImV4cCI6MTc1MDA5NjExOCwiaWF0IjoxNzQ5NDkxMzE4fQ.sRH6KvMHAV7LUhVfrtAcN9qis6k8eS1OWrBhO3eYAg8';

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

// Étape 1: Récupérer les IDs d'habitudes via l'API debug
async function getHabitIds() {
  console.log('🔍 === RÉCUPÉRATION DES IDs D\'HABITUDES ===\n');
  
  console.log('🔗 Testing /api/debug/ids/habits...');
  const result = await makeRequest('/api/debug/ids/habits');
  
  if (result.success) {
    console.log(`   ✅ Status: ${result.status}`);
    console.log(`   📊 Count: ${result.data.count}`);
    console.log(`   📊 IDs: ${result.data.ids.length} items`);
    
    if (result.data.items && result.data.items.length > 0) {
      console.log('\n📋 Habitudes trouvées:');
      result.data.items.forEach((habit, index) => {
        console.log(`   ${index + 1}. ${habit.name} (ID: ${habit.id})`);
        console.log(`      Fréquence: ${habit.frequency}, Couleur: ${habit.color}`);
      });
    }
    
    return result.data;
  } else {
    console.log(`   ❌ Status: ${result.status} - ${result.data?.error || result.error}`);
    return null;
  }
}

// Étape 2: Récupérer les quick IDs également
async function getQuickIds() {
  console.log('\n🔗 Testing /api/debug/quick-ids...');
  const result = await makeRequest('/api/debug/quick-ids');
  
  if (result.success) {
    console.log(`   ✅ Status: ${result.status}`);
    console.log(`   📊 Quick IDs: ${Object.keys(result.data.quickIds).length} items`);
    
    if (result.data.quickIds.habitId) {
      console.log(`   🎯 Habit ID trouvé: ${result.data.quickIds.habitId}`);
    }
    
    return result.data.quickIds;
  } else {
    console.log(`   ❌ Status: ${result.status} - ${result.data?.error || result.error}`);
    return null;
  }
}

// Étape 3: Tester l'API habits/agent avec différentes approches
async function testHabitsAPI(habitId) {
  console.log('\n🤖 === TEST DES APIs HABITS/AGENT ===\n');
  
  if (!habitId) {
    console.log('❌ Aucun ID d\'habitude disponible pour les tests');
    return;
  }

  console.log(`🎯 Utilisation de l'ID d'habitude: ${habitId}\n`);

  // Test 1: POST avec ID d'habitude (probablement pour marquer comme complété)
  console.log('🔗 Test 1: POST /api/habits/agent (marquer habitude)...');
  const markResult = await makeRequest('/api/habits/agent', 'POST', {
    habitId: habitId,
    date: new Date().toISOString().split('T')[0], // Date d'aujourd'hui
    completed: true
  });
  
  if (markResult.success) {
    console.log(`   ✅ Status: ${markResult.status}`);
    console.log(`   📊 Réponse:`, Object.keys(markResult.data));
    if (markResult.data.id) {
      console.log(`   🆔 Entry ID: ${markResult.data.id}`);
    }
  } else {
    console.log(`   ❌ Status: ${markResult.status} - ${markResult.data?.error || markResult.error}`);
  }

  // Test 2: POST avec juste l'ID (format minimal)
  console.log('\n🔗 Test 2: POST /api/habits/agent (format minimal)...');
  const minimalResult = await makeRequest('/api/habits/agent', 'POST', {
    habitId: habitId
  });
  
  if (minimalResult.success) {
    console.log(`   ✅ Status: ${minimalResult.status}`);
    console.log(`   📊 Réponse:`, Object.keys(minimalResult.data));
  } else {
    console.log(`   ❌ Status: ${minimalResult.status} - ${minimalResult.data?.error || minimalResult.error}`);
  }

  // Test 3: POST avec des données complètes
  console.log('\n🔗 Test 3: POST /api/habits/agent (données complètes)...');
  const completeResult = await makeRequest('/api/habits/agent', 'POST', {
    habitId: habitId,
    date: new Date().toISOString().split('T')[0],
    completed: true,
    note: "Complété via API test"
  });
  
  if (completeResult.success) {
    console.log(`   ✅ Status: ${completeResult.status}`);
    console.log(`   📊 Réponse:`, Object.keys(completeResult.data));
    if (completeResult.data.note) {
      console.log(`   📝 Note: ${completeResult.data.note}`);
    }
  } else {
    console.log(`   ❌ Status: ${completeResult.status} - ${completeResult.data?.error || completeResult.error}`);
  }

  return {
    markResult,
    minimalResult,
    completeResult
  };
}

// Étape 4: Tester la création d'une nouvelle habitude (si endpoint différent)
async function testHabitCreation() {
  console.log('\n🔨 === TEST CRÉATION D\'HABITUDE ===\n');
  
  // Essayer différents endpoints possibles pour la création
  const creationEndpoints = [
    '/api/habits',
    '/api/habits/create',
    '/api/habits/new'
  ];
  
  const habitData = {
    name: `Nouvelle habitude ${new Date().toLocaleTimeString('fr-FR')}`,
    description: 'Habitude créée via API test',
    frequency: 'daily',
    color: '#8B5CF6',
    category: 'personnel'
  };

  for (const endpoint of creationEndpoints) {
    console.log(`🔗 Testing ${endpoint}...`);
    const result = await makeRequest(endpoint, 'POST', habitData);
    
    if (result.success) {
      console.log(`   ✅ Status: ${result.status} - Création réussie !`);
      console.log(`   🆔 ID créé: ${result.data.id}`);
      console.log(`   📝 Nom: ${result.data.name}`);
      return result.data;
    } else {
      console.log(`   ❌ Status: ${result.status} - ${result.data?.error || result.error}`);
    }
  }
  
  return null;
}

// Fonction principale
async function runHabitTests() {
  console.log('🚀 === TEST COMPLET DES HABITUDES AVEC IDs ===');
  console.log('===============================================\n');
  
  try {
    // Étape 1: Récupérer les IDs
    const habitData = await getHabitIds();
    const quickIds = await getQuickIds();
    
    // Déterminer l'ID à utiliser
    let habitId = null;
    if (quickIds && quickIds.habitId) {
      habitId = quickIds.habitId;
    } else if (habitData && habitData.ids && habitData.ids.length > 0) {
      habitId = habitData.ids[0];
    }
    
    // Étape 2: Tester l'API avec l'ID
    const habitResults = await testHabitsAPI(habitId);
    
    // Étape 3: Tester la création
    const creationResult = await testHabitCreation();
    
    // Résumé
    console.log('\n📊 === RÉSUMÉ ===');
    console.log('=================');
    console.log(`🎯 Habit ID utilisé: ${habitId || 'Aucun'}`);
    
    if (habitResults) {
      const successes = Object.values(habitResults).filter(r => r.success).length;
      console.log(`✅ Tests habits/agent: ${successes}/3 réussis`);
    }
    
    console.log(`🔨 Création d'habitude: ${creationResult ? '✅ Réussie' : '❌ Échouée'}`);
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests
runHabitTests(); 