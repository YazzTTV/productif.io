const http = require('http');

const TOKEN_NOAH = 'eyJhbGciOiJIUzI1NiJ9.eyJ0b2tlbklkIjoiZWZmODAwMTk4ZmYwMzlmOTNmZDcyMjQ0YWMyZDcwMWIiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJoYWJpdHM6d3JpdGUiLCJ0YXNrczp3cml0ZSIsInByb2plY3RzOndyaXRlIiwib2JqZWN0aXZlczp3cml0ZSIsInByb2Nlc3Nlczp3cml0ZSIsInByb2Nlc3NlczpyZWFkIl0sImV4cCI6MTc1MDA5NjYwNn0.jg0J-ILZsbuKzhHxxV730Lh122ohooLYERHj8U69yKU';

async function testQuickIds() {
  console.log('🧪 Test du compte Noah');
  console.log('Token ID:', TOKEN_NOAH.split('.')[1].substring(0, 20) + '...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/debug/quick-ids',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN_NOAH}`,
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
        console.log('Status:', res.statusCode);
        
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('✅ COMPTE NOAH:');
            console.log('  Email:', json.user.email);
            console.log('  Nom:', json.user.name);
            console.log('  ID:', json.user.id);
            console.log('  Rôle:', json.user.role || 'USER');
            
            console.log('\n📊 Données:');
            const quickIds = json.quickIds;
            Object.keys(quickIds).forEach(key => {
              if (quickIds[key]) {
                console.log(`  ✅ ${key}: ${quickIds[key]}`);
              } else {
                console.log(`  ❌ ${key}: null`);
              }
            });
          } catch (e) {
            console.log('Erreur parsing:', e.message);
          }
        } else {
          console.log('Erreur:', data);
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('Erreur réseau:', error.message);
      resolve();
    });

    req.end();
  });
}

testQuickIds(); 