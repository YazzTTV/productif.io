import fetch from 'node-fetch';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMTBkZDQwMTYyZDM4YzU1YjhmNmQwOTI1MjVjZjRiOTAiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl19.X1CQMOsCBvk9DxUzUogguU9ruFKN0aaHUa44R6dpmM0";

async function testEndpoint(url) {
  console.log(`\n🔍 Test de l'endpoint: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    console.log('📋 Headers:', response.headers.raw());

    const data = await response.text();
    try {
      const jsonData = JSON.parse(data);
      console.log('\n✅ Réponse (JSON):');
      console.log(JSON.stringify(jsonData, null, 2));
      return jsonData;
    } catch (e) {
      console.log('\n❌ Réponse (non-JSON):');
      console.log(data);
      return null;
    }
  } catch (error) {
    console.error(`\n❌ Erreur réseau: ${error.message}`);
    return null;
  }
}

async function testDebugApi() {
  console.log('🚀 Démarrage des tests de l\'API debug...');

  // Test local
  console.log('\n=== TEST LOCAL ===');
  await testEndpoint('http://localhost:3000/api/debug/ids/user-team');

  // Test production
  console.log('\n=== TEST PRODUCTION ===');
  await testEndpoint('https://productif-io-1-m2edizrwt-noahs-projects-6c1762cf.vercel.app/api/debug/ids/user-team');
}

// Exécuter le test
testDebugApi().catch(error => {
  console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });