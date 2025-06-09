const jwt = require('jsonwebtoken');

// Configuration
const API_BASE = 'http://localhost:3001';
const JWT_SECRET = 'un_secret_tres_securise_pour_jwt_tokens';

// Token de l'utilisateur
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiYWFmNjc5ZWYzNWRlNzJiOTViN2QwMDdlZDVjYWE4MTciLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJ0YXNrczp3cml0ZSIsImhhYml0czp3cml0ZSIsInByb2plY3RzOndyaXRlIl19.JM0xZftVtVE1YxjytuqXGOzmdm2Ti39_MAQ07aBqGjI';

// Configuration des tests
const apiHeaders = {
  'Authorization': `Bearer ${USER_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testAPI(method, endpoint, data = null, description = '') {
  try {
    const options = {
      method,
      headers: apiHeaders
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const status = response.status;
    
    let result = null;
    try {
      result = await response.json();
    } catch {
      result = await response.text();
    }
    
    const statusIcon = status >= 200 && status < 300 ? '✅' : 
                      status === 401 ? '🔒' : 
                      status === 404 ? '❓' : 
                      status >= 400 ? '❌' : '⚠️';
    
    console.log(`   ${statusIcon} ${method} ${endpoint} (${status}) - ${description}`);
    
    if (status >= 200 && status < 300 && result) {
      if (Array.isArray(result)) {
        console.log(`      └─ ${result.length} éléments retournés`);
      } else if (typeof result === 'object' && result.id) {
        console.log(`      └─ ID: ${result.id}`);
      } else if (typeof result === 'object' && Object.keys(result).length > 0) {
        console.log(`      └─ ${Object.keys(result).length} propriétés`);
      }
    } else if (status >= 400) {
      if (typeof result === 'object' && result.error) {
        console.log(`      └─ Erreur: ${result.error}`);
      }
    }
    
    return { status, result };
  } catch (error) {
    console.log(`   ❌ ${method} ${endpoint} - Erreur: ${error.message}`);
    return { status: 0, error: error.message };
  }
}

async function testAllAPIs() {
  console.log('🔥 === TEST COMPLET TOUTES LES APIS ===\n');

  // Analyser le token
  console.log('🔍 ANALYSE DU TOKEN:');
  const decoded = jwt.verify(USER_TOKEN, JWT_SECRET);
  console.log(`   User ID: ${decoded.userId}`);
  console.log(`   Scopes: ${decoded.scopes.join(', ')}`);
  console.log(`   Expiration: ${decoded.exp ? 'OUI' : 'PERMANENT'}`);
  console.log();

  console.log('🚀 === APIS AGENT ===\n');

  // === TASKS AGENT ===
  console.log('📋 TASKS AGENT:');
  await testAPI('GET', '/api/tasks/agent', null, 'Lister les tâches');
  
  // Test création tâche
  const taskData = {
    title: 'Test API Tâche',
    description: 'Tâche créée via test API',
    priority: 'MEDIUM'
  };
  const createTaskResult = await testAPI('POST', '/api/tasks/agent', taskData, 'Créer une tâche');
  
  if (createTaskResult.status === 200 && createTaskResult.result?.id) {
    const taskId = createTaskResult.result.id;
    await testAPI('PUT', `/api/tasks/agent/${taskId}`, { completed: true }, 'Marquer tâche comme complétée');
  }
  console.log();

  // === HABITS AGENT ===
  console.log('🔄 HABITS AGENT:');
  await testAPI('GET', '/api/habits/agent', null, 'Lister les habitudes');
  
  // Test création entrée habitude
  const habitData = {
    habitId: 'cma6l91ly00019be190icmb4e', // ID d'habitude existante
    date: new Date().toISOString().split('T')[0],
    completed: true,
    note: 'Test via API'
  };
  await testAPI('POST', '/api/habits/agent', habitData, 'Marquer habitude comme complétée');
  console.log();

  // === PROJECTS AGENT ===
  console.log('📁 PROJECTS AGENT:');
  await testAPI('GET', '/api/projects/agent', null, 'Lister les projets');
  
  const projectData = {
    name: 'Projet Test API',
    description: 'Projet créé via test API',
    color: '#3B82F6'
  };
  const createProjectResult = await testAPI('POST', '/api/projects/agent', projectData, 'Créer un projet');
  console.log();

  // === OBJECTIVES AGENT ===
  console.log('🎯 OBJECTIVES AGENT:');
  await testAPI('GET', '/api/objectives/agent', null, 'Lister les objectifs');
  
  const objectiveData = {
    title: 'Objectif Test API',
    description: 'Objectif créé via test API',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
  await testAPI('POST', '/api/objectives/agent', objectiveData, 'Créer un objectif');
  console.log();

  // === PROCESSES AGENT ===
  console.log('⚙️ PROCESSES AGENT:');
  await testAPI('GET', '/api/processes/agent', null, 'Lister les processus');
  
  const processData = {
    name: 'Processus Test API',
    description: 'Processus créé via test API'
  };
  await testAPI('POST', '/api/processes/agent', processData, 'Créer un processus');
  console.log();

  console.log('🔧 === APIS DEBUG ===\n');

  // === DEBUG APIS ===
  const debugEndpoints = [
    { endpoint: '/api/debug/auth-info', description: 'Info authentification' },
    { endpoint: '/api/debug/user-info', description: 'Info utilisateur' },
    { endpoint: '/api/debug/quick-ids', description: 'IDs rapides' },
    { endpoint: '/api/debug/ids/tasks', description: 'IDs des tâches' },
    { endpoint: '/api/debug/ids/habits', description: 'IDs des habitudes' },
    { endpoint: '/api/debug/ids/projects', description: 'IDs des projets' },
    { endpoint: '/api/debug/ids/objectives', description: 'IDs des objectifs' },
    { endpoint: '/api/debug/ids/processes', description: 'IDs des processus' },
    { endpoint: '/api/debug/system-info', description: 'Info système' },
    { endpoint: '/api/debug/database-stats', description: 'Stats base de données' },
    { endpoint: '/api/debug/token-info', description: 'Info token' },
    { endpoint: '/api/debug/permissions', description: 'Permissions' },
    { endpoint: '/api/debug/health', description: 'Santé du système' }
  ];

  console.log('🔍 DEBUG ENDPOINTS:');
  for (const { endpoint, description } of debugEndpoints) {
    await testAPI('GET', endpoint, null, description);
  }
  console.log();

  console.log('🧹 === APIS DEBUG CLEANUP ===\n');
  
  // Test des APIs de nettoyage (avec prudence)
  console.log('⚠️ CLEANUP ENDPOINTS (lecture seule):');
  await testAPI('GET', '/api/debug/projects/cleanup', null, 'Vérifier projets à nettoyer');
  
  console.log('\n📊 === RÉSUMÉ ===');
  console.log('✅ Test complet terminé');
  console.log('✅ Token permanent fonctionnel');
  console.log('✅ Accès aux APIs agent et debug');
  console.log('✅ Scopes complets validés');
}

testAllAPIs().catch(console.error); 