const http = require('http');

// Nouveau token de Noah
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0b2tlbklkIjoiZWZmODAwMTk4ZmYwMzlmOTNmZDcyMjQ0YWMyZDcwMWIiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJoYWJpdHM6d3JpdGUiLCJ0YXNrczp3cml0ZSIsInByb2plY3RzOndyaXRlIiwib2JqZWN0aXZlczp3cml0ZSIsInByb2Nlc3Nlczp3cml0ZSIsInByb2Nlc3NlczpyZWFkIl0sImV4cCI6MTc1MDA5NjYwNn0.jg0J-ILZsbuKzhHxxV730Lh122ohooLYERHj8U69yKU';

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
            data: jsonData
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

async function testNoahAccount() {
  console.log('🧪 === TEST DU COMPTE NOAH ===');
  console.log('==============================\n');

  // Test 1: Informations du compte
  console.log('🔗 Testing /api/debug/quick-ids...');
  const quickIdsResult = await makeRequest('/api/debug/quick-ids');
  
  if (quickIdsResult.success) {
    console.log(`   ✅ Status: ${quickIdsResult.status}`);
    console.log('👤 COMPTE NOAH:');
    console.log('===============');
    console.log('🆔 ID:', quickIdsResult.data.user.id);
    console.log('📧 Email:', quickIdsResult.data.user.email);
    console.log('👤 Nom:', quickIdsResult.data.user.name);
    console.log('🔰 Rôle:', quickIdsResult.data.user.role || 'USER');
    
    console.log('\n📊 DONNÉES DISPONIBLES:');
    console.log('======================');
    Object.entries(quickIdsResult.data.quickIds).forEach(([key, value]) => {
      if (value) {
        console.log('✅', key + ':', value);
      } else {
        console.log('❌', key + ': null');
      }
    });
  } else {
    console.log(`   ❌ Status: ${quickIdsResult.status} - ${quickIdsResult.data?.error || quickIdsResult.error}`);
    return;
  }

  // Test 2: Habitudes de Noah
  console.log('\n🔗 Testing /api/habits/agent...');
  const habitsResult = await makeRequest('/api/habits/agent');
  
  if (habitsResult.success) {
    console.log(`   ✅ Status: ${habitsResult.status}`);
    console.log(`   📊 Habitudes: ${habitsResult.data.length} trouvée(s)`);
    
    if (habitsResult.data.length > 0) {
      console.log('\n📋 Habitudes de Noah:');
      habitsResult.data.forEach((habit, index) => {
        console.log(`   ${index + 1}. ${habit.name} (ID: ${habit.id})`);
        console.log(`      Fréquence: ${habit.frequency}, Couleur: ${habit.color || 'Non définie'}`);
      });
    }
  } else {
    console.log(`   ❌ Status: ${habitsResult.status} - ${habitsResult.data?.error || habitsResult.error}`);
  }

  // Test 3: Tâches de Noah
  console.log('\n🔗 Testing /api/tasks/agent...');
  const tasksResult = await makeRequest('/api/tasks/agent');
  
  if (tasksResult.success) {
    console.log(`   ✅ Status: ${tasksResult.status}`);
    console.log(`   📊 Tâches: ${tasksResult.data.length} trouvée(s)`);
    
    if (tasksResult.data.length > 0) {
      console.log('\n📋 Tâches de Noah:');
      tasksResult.data.slice(0, 3).forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.title} (ID: ${task.id})`);
        console.log(`      Complétée: ${task.completed}, Priorité: ${task.priority}`);
      });
      if (tasksResult.data.length > 3) {
        console.log(`   ... et ${tasksResult.data.length - 3} autre(s) tâche(s)`);
      }
    }
  } else {
    console.log(`   ❌ Status: ${tasksResult.status} - ${tasksResult.data?.error || tasksResult.error}`);
  }

  // Test 4: Test de création d'une nouvelle tâche pour Noah
  console.log('\n🔗 Testing POST /api/tasks/agent (création tâche pour Noah)...');
  const newTaskResult = await makeRequest('/api/tasks/agent', 'POST', {
    title: `Tâche de Noah créée le ${new Date().toLocaleString('fr-FR')}`,
    description: 'Tâche créée via API pour tester le compte de Noah',
    priority: 2,
    energyLevel: 1
  });
  
  if (newTaskResult.success) {
    console.log(`   ✅ Status: ${newTaskResult.status}`);
    console.log(`   🆔 Nouvelle tâche créée: ${newTaskResult.data.id}`);
    console.log(`   📝 Titre: ${newTaskResult.data.title}`);
  } else {
    console.log(`   ❌ Status: ${newTaskResult.status} - ${newTaskResult.data?.error || newTaskResult.error}`);
  }

  console.log('\n🎯 === RÉSUMÉ NOAH ===');
  console.log('=====================');
  console.log('📧 Compte testé: noah.lugagne@free.fr');
  console.log('🔐 Token: Valide avec 10 scopes');
  console.log('📊 APIs testées: 4/4');
  console.log('⏰ Token expire le: 16/06/2025 19:56:46');
}

testNoahAccount(); 