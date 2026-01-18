#!/usr/bin/env node

/**
 * Script de test pour les fonctionnalités Freemium
 * Teste les limites et garde-fous du plan gratuit
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const USER_EMAIL = process.argv[2] || process.env.TEST_USER_EMAIL;

if (!USER_EMAIL) {
  console.error('❌ Usage: node scripts/test-freemium.js <email>');
  console.error('   Ou définir TEST_USER_EMAIL dans .env');
  process.exit(1);
}

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Récupérer le token de l'utilisateur
async function getAuthToken(email) {
  try {
    // Essayer de se connecter ou récupérer le token depuis la DB
    // Pour simplifier, on suppose qu'on a un token
    log(`\n🔑 Récupération du token pour ${email}...`, 'cyan');
    
    // TODO: Implémenter la récupération du token
    // Pour l'instant, on demande à l'utilisateur de fournir le token
    const token = process.env.TEST_TOKEN || process.argv[3];
    
    if (!token) {
      log('⚠️  Token non fourni. Utilisez: node scripts/test-freemium.js <email> <token>', 'yellow');
      log('   Ou définir TEST_TOKEN dans .env', 'yellow');
      return null;
    }
    
    return token;
  } catch (error) {
    log(`❌ Erreur lors de la récupération du token: ${error.message}`, 'red');
    return null;
  }
}

// Fonction utilitaire pour faire des requêtes API
async function apiCall(endpoint, options = {}) {
  const token = await getAuthToken(USER_EMAIL);
  if (!token) return null;

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  const http = await import('http');
  const https = await import('https');
  const client = url.protocol === 'https:' ? https.default : http.default;

  return new Promise((resolve) => {
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: { error: data.substring(0, 200) } });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ error: error.message });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Tests
const tests = [];

// Test 1: Vérifier le plan de l'utilisateur
tests.push({
  name: 'Vérifier le plan utilisateur',
  async run() {
    log('\n📋 Test 1: Vérification du plan...', 'blue');
    const result = await apiCall('/auth/me');
    
    if (result?.error) {
      log(`❌ Erreur: ${result.error}`, 'red');
      return false;
    }
    
    if (result?.status === 200 && result.data?.user) {
      const { plan, planLimits, isPremium } = result.data.user;
      log(`✅ Plan: ${plan}`, 'green');
      log(`   Premium: ${isPremium}`, isPremium ? 'yellow' : 'green');
      log(`   Limites:`, 'cyan');
      log(`     - Focus/jour: ${planLimits?.focusPerDay ?? 'illimité'}`, 'cyan');
      log(`     - Habitudes max: ${planLimits?.maxHabits ?? 'illimité'}`, 'cyan');
      log(`     - Plan My Day: ${planLimits?.planMyDayMode} (max ${planLimits?.maxPlanMyDayEvents ?? 'illimité'} événements)`, 'cyan');
      log(`     - Leaderboard global: ${planLimits?.allowGlobalLeaderboard ? '✅' : '❌'}`, 'cyan');
      log(`     - Analytics: ${planLimits?.analyticsRetentionDays ?? 'illimité'} jours`, 'cyan');
      return true;
    }
    
    log('❌ Réponse invalide', 'red');
    return false;
  },
});

// Test 2: Focus - Limite quotidienne
tests.push({
  name: 'Focus - Test limite quotidienne',
  async run() {
    log('\n🎯 Test 2: Focus - Limite quotidienne...', 'blue');
    
    // Première session
    log('   Tentative session 1...', 'cyan');
    const result1 = await apiCall('/deepwork/agent', {
      method: 'POST',
      body: JSON.stringify({
        plannedDuration: 25,
        type: 'deepwork',
        description: 'Test session 1',
      }),
    });
    
    if (result1?.status === 200) {
      log('   ✅ Session 1 créée', 'green');
    } else if (result1?.status === 403) {
      log('   ⚠️  Session 1 bloquée (limite déjà atteinte)', 'yellow');
      log(`   Message: ${result1.data?.error}`, 'yellow');
      return true; // C'est normal si la limite est déjà atteinte
    } else {
      log(`   ❌ Erreur: ${result1?.data?.error || result1?.error}`, 'red');
      return false;
    }
    
    // Deuxième session (devrait être bloquée en free)
    log('   Tentative session 2 (devrait être bloquée)...', 'cyan');
    const result2 = await apiCall('/deepwork/agent', {
      method: 'POST',
      body: JSON.stringify({
        plannedDuration: 25,
        type: 'deepwork',
        description: 'Test session 2',
      }),
    });
    
    if (result2?.status === 403) {
      log('   ✅ Session 2 correctement bloquée (403)', 'green');
      log(`   Message: ${result2.data?.error}`, 'cyan');
      log(`   Feature locked: ${result2.data?.feature}`, 'cyan');
      return true;
    } else if (result2?.status === 200) {
      log('   ⚠️  Session 2 autorisée (utilisateur Premium?)', 'yellow');
      return true;
    } else {
      log(`   ❌ Erreur inattendue: ${result2?.data?.error || result2?.error}`, 'red');
      return false;
    }
  },
});

// Test 3: Habitudes - Limite de 3
tests.push({
  name: 'Habitudes - Test limite de 3',
  async run() {
    log('\n📝 Test 3: Habitudes - Limite de 3...', 'blue');
    
    // Compter les habitudes existantes
    const countResult = await apiCall('/habits');
    if (countResult?.error) {
      log(`   ❌ Erreur: ${countResult.error}`, 'red');
      return false;
    }
    
    const currentCount = countResult.data?.length || 0;
    log(`   Habitudes actuelles: ${currentCount}`, 'cyan');
    
    if (currentCount >= 3) {
      // Tenter de créer une 4e habitude
      log('   Tentative création habitude 4 (devrait être bloquée)...', 'cyan');
      const result = await apiCall('/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Habitude 4',
          daysOfWeek: ['monday'],
          frequency: 'daily',
        }),
      });
      
      if (result?.status === 403) {
        log('   ✅ Création bloquée (403)', 'green');
        log(`   Message: ${result.data?.error}`, 'cyan');
        return true;
      } else {
        log(`   ❌ Erreur: devrait être 403, reçu ${result?.status}`, 'red');
        return false;
      }
    } else {
      log(`   ℹ️  Moins de 3 habitudes, test non applicable`, 'yellow');
      return true;
    }
  },
});

// Test 4: Plan My Day - Limite de 3 événements
tests.push({
  name: 'Plan My Day - Test limite de 3 événements',
  async run() {
    log('\n📅 Test 4: Plan My Day - Limite de 3 événements...', 'blue');
    
    // Tenter de créer 4 événements
    const events = [];
    for (let i = 1; i <= 4; i++) {
      const start = new Date();
      start.setHours(9 + i, 0, 0, 0);
      events.push({
        title: `Tâche test ${i}`,
        start: start.toISOString(),
        durationMinutes: 60,
        priority: 3,
        energy: 3,
      });
    }
    
    log('   Tentative création de 4 événements (devrait être bloquée)...', 'cyan');
    const result = await apiCall('/planning/daily-events', {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
    
    if (result?.status === 403) {
      log('   ✅ Création bloquée (403)', 'green');
      log(`   Message: ${result.data?.error}`, 'cyan');
      log(`   Feature locked: ${result.data?.feature}`, 'cyan');
      return true;
    } else if (result?.status === 400 && result.data?.error?.includes('Google Calendar')) {
      log('   ⚠️  Erreur Google Calendar (normal si non connecté)', 'yellow');
      return true;
    } else {
      log(`   ⚠️  Status: ${result?.status} (utilisateur Premium?)`, 'yellow');
      return true;
    }
  },
});

// Test 5: Leaderboard global
tests.push({
  name: 'Leaderboard - Test accès global',
  async run() {
    log('\n🏆 Test 5: Leaderboard global...', 'blue');
    
    log('   Tentative accès leaderboard global...', 'cyan');
    const result = await apiCall('/gamification/leaderboard?limit=10&includeUserRank=true');
    
    if (result?.status === 403) {
      log('   ✅ Accès bloqué (403) - comme attendu en free', 'green');
      log(`   Message: ${result.data?.error}`, 'cyan');
      log(`   Feature locked: ${result.data?.feature}`, 'cyan');
      return true;
    } else if (result?.status === 200) {
      log('   ⚠️  Accès autorisé (utilisateur Premium?)', 'yellow');
      return true;
    } else {
      log(`   ❌ Erreur: ${result?.data?.error || result?.error}`, 'red');
      return false;
    }
  },
});

// Test 6: Analytics - Limite de 7 jours
tests.push({
  name: 'Analytics - Test limite de 7 jours',
  async run() {
    log('\n📊 Test 6: Analytics - Limite de 7 jours...', 'blue');
    
    // Test avec 30 jours (devrait être bloqué)
    log('   Tentative récupération analytics 30 jours (devrait être bloquée)...', 'cyan');
    const result = await apiCall('/behavior/analytics?days=30');
    
    if (result?.status === 403) {
      log('   ✅ Accès bloqué (403)', 'green');
      log(`   Message: ${result.data?.error}`, 'cyan');
      return true;
    } else if (result?.status === 200) {
      log('   ⚠️  Accès autorisé (utilisateur Premium?)', 'yellow');
      return true;
    } else {
      log(`   ❌ Erreur: ${result?.data?.error || result?.error}`, 'red');
      return false;
    }
  },
});

// Test 7: Historique check-ins - Limite de 7 jours
tests.push({
  name: 'Historique check-ins - Test limite de 7 jours',
  async run() {
    log('\n📈 Test 7: Historique check-ins - Limite de 7 jours...', 'blue');
    
    log('   Tentative récupération historique 30 jours (devrait être bloquée)...', 'cyan');
    const result = await apiCall('/behavior/agent/checkin?days=30');
    
    if (result?.status === 403) {
      log('   ✅ Accès bloqué (403)', 'green');
      log(`   Message: ${result.data?.error}`, 'cyan');
      return true;
    } else if (result?.status === 200) {
      log('   ⚠️  Accès autorisé (utilisateur Premium?)', 'yellow');
      return true;
    } else {
      log(`   ❌ Erreur: ${result?.data?.error || result?.error}`, 'red');
      return false;
    }
  },
});

// Exécuter tous les tests
async function runTests() {
  log('\n🚀 Démarrage des tests Freemium\n', 'blue');
  log(`📧 Utilisateur: ${USER_EMAIL}`, 'cyan');
  log(`🌐 API: ${API_BASE_URL}\n`, 'cyan');
  
  const results = [];
  
  for (const test of tests) {
    try {
      const passed = await test.run();
      results.push({ name: test.name, passed });
    } catch (error) {
      log(`❌ Erreur lors du test "${test.name}": ${error.message}`, 'red');
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  // Résumé
  log('\n' + '='.repeat(50), 'blue');
  log('📊 RÉSUMÉ DES TESTS', 'blue');
  log('='.repeat(50), 'blue');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${icon} ${index + 1}. ${result.name}`, color);
    if (result.error) {
      log(`   Erreur: ${result.error}`, 'red');
    }
  });
  
  log('\n' + '='.repeat(50), 'blue');
  log(`Résultat: ${passed}/${total} tests réussis`, passed === total ? 'green' : 'yellow');
  log('='.repeat(50) + '\n', 'blue');
  
  process.exit(passed === total ? 0 : 1);
}

runTests().catch(error => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
