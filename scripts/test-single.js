const http = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiN2YzMzNmMmZiYjFjNWQyZDQzNzJhNGU3ZjQwMTFhN2UiLCJ1c2VySWQiOiJjbWE2bDkxbHkwMDAwOWJlMTkwaWJ5bGhjIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsImhhYml0czp3cml0ZSIsInRhc2tzOndyaXRlIl0sImV4cCI6MTc2MDYzMjc1MSwiaWF0IjoxNzYwMDI3OTUxfQ.vDQ1CAsCFiN09g_d2H0I1qCw3meSiNwqsR-t_6UKeOY';

async function testEndpoint() {
  console.log('🔗 Testing /api/habits/agent...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/habits/agent',
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
        console.log(`Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode === 200 && jsonData.quickIds) {
            console.log('✅ SUCCESS! Quick IDs found:', Object.keys(jsonData.quickIds).length);
          } else {
            console.log('❌ Failed:', jsonData.error || 'Unknown error');
          }
        } catch (parseError) {
          console.log('⚠️ Non-JSON response');
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

testEndpoint(); 