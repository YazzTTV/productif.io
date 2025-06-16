const http = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMTg4YjgxOWI4MTJhNDdmMDY3YWNiNjk1MDE2ZDU0ZDMiLCJ1c2VySWQiOiJjbWE2bDkxbHkwMDAwOWJlMTkwaWJ5bGhjIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsImhhYml0czp3cml0ZSIsInRhc2tzOndyaXRlIl0sImV4cCI6MTc1MDY3MTAyOCwiaWF0IjoxNzUwMDY2MjI4fQ.GiGXwuYCwyE_MpJcc4H9gtuyJR32oXhE0_tArlmfedg';

async function createTask() {
  console.log('🔗 Testing POST /api/tasks/agent (Creating new task)...');
  
  // Données de la nouvelle tâche
  const taskData = {
    title: `Tâche de test créée le ${new Date().toLocaleString('fr-FR')}`,
    description: 'Ceci est une tâche créée via l\'API avec un token d\'authentification',
    priority: 2, // 0-4 (0=Urgent, 1=Haute, 2=Moyenne, 3=Basse, 4=Someday)
    energyLevel: 1 // 0-3 (0=Extrême, 1=Élevé, 2=Moyen, 3=Faible)
  };

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/tasks/agent',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  const postData = JSON.stringify(taskData);

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        
        try {
          const jsonData = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ SUCCESS! Tâche créée:');
            console.log(`   ID: ${jsonData.id}`);
            console.log(`   Titre: ${jsonData.title}`);
            console.log(`   Priorité: ${jsonData.priority}`);
            console.log(`   Niveau d'énergie: ${jsonData.energyLevel}`);
            console.log(`   Créée le: ${new Date(jsonData.createdAt).toLocaleString('fr-FR')}`);
          } else {
            console.log('❌ Failed:', jsonData.error || 'Unknown error');
            console.log('Full response:', JSON.stringify(jsonData, null, 2));
          }
        } catch (parseError) {
          console.log('⚠️ Non-JSON response:', data);
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      resolve();
    });

    // Envoyer les données
    req.write(postData);
    req.end();
  });
}

// Test également la récupération des tâches pour vérifier
async function listTasks() {
  console.log('\n🔗 Testing GET /api/tasks/agent (Listing tasks)...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/tasks/agent',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
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
        
        try {
          const jsonData = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log(`✅ SUCCESS! ${jsonData.length} tâche(s) trouvée(s):`);
            jsonData.slice(0, 3).forEach((task, index) => {
              console.log(`   ${index + 1}. ${task.title} (ID: ${task.id})`);
              console.log(`      Priorité: ${task.priority}, Énergie: ${task.energyLevel}, Complétée: ${task.completed}`);
            });
            if (jsonData.length > 3) {
              console.log(`   ... et ${jsonData.length - 3} autre(s) tâche(s)`);
            }
          } else {
            console.log('❌ Failed:', jsonData.error || 'Unknown error');
          }
        } catch (parseError) {
          console.log('⚠️ Non-JSON response:', data.substring(0, 200));
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

// Exécuter les tests
async function runTests() {
  console.log('🚀 === TEST CRÉATION ET LECTURE DE TÂCHE ===\n');
  
  await createTask();
  await listTasks();
  
  console.log('\n✅ Tests terminés !');
}

runTests(); 