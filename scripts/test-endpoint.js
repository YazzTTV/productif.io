import fetch from 'node-fetch';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMjdkZWNlYTc2NWRhZmY1NDA0ZTk4YTU0M2Y3NTVjNDMiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwicHJvamVjdHM6cmVhZCIsInRhc2tzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIiwicHJvY2Vzc2VzOndyaXRlIl19.t2npNd5c_OCic5eiX87domV1ZFfei6QfIKsagGCA-oE';

async function testEndpoint() {
  try {
    // Test en local
    console.log('🔍 Test de l\'endpoint en local...');
    const localResponse = await fetch('http://localhost:3000/api/debug/ids/user-team', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const localData = await localResponse.json();
    console.log('📝 Réponse locale:', JSON.stringify(localData, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testEndpoint(); 