import * as jose from 'jose';
import jwt from 'jsonwebtoken';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMjdkZWNlYTc2NWRhZmY1NDA0ZTk4YTU0M2Y3NTVjNDMiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwicHJvamVjdHM6cmVhZCIsInRhc2tzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIiwicHJvY2Vzc2VzOndyaXRlIl19.t2npNd5c_OCic5eiX87domV1ZFfei6QfIKsagGCA-oE';

// Les différentes clés possibles
const possibleSecrets = [
  process.env.JWT_SECRET,
  "your-secret-key",
  "your-super-secret-jwt-key",
  "un_secret_tres_securise_pour_jwt_tokens"
];

async function debugJWT() {
  console.log('🔍 === DIAGNOSTIC JWT ===\n');
  
  console.log('1️⃣ Variables d\'environnement:');
  console.log(`JWT_SECRET défini: ${process.env.JWT_SECRET ? 'OUI' : 'NON'}`);
  if (process.env.JWT_SECRET) {
    console.log(`Valeur: ${process.env.JWT_SECRET.substring(0, 10)}...`);
  }
  console.log();

  console.log('2️⃣ Décodage du token:');
  const decoded = jwt.decode(token, { complete: true });
  console.log('Header:', decoded.header);
  console.log('Payload:', decoded.payload);
  console.log();

  console.log('3️⃣ Test de vérification avec différentes clés:');
  
  // Test avec jose (comme dans l'API)
  console.log('\nTest avec jose:');
  for (const secret of possibleSecrets) {
    if (!secret) continue;
    
    try {
      const secretBytes = new TextEncoder().encode(secret);
      const result = await jose.jwtVerify(token, secretBytes);
      console.log(`✅ Succès avec clé: ${secret.substring(0, 20)}...`);
      console.log('Payload vérifié:', result.payload);
    } catch (error) {
      console.log(`❌ Échec avec clé: ${secret.substring(0, 20)}...`);
      console.log('  Erreur:', error.code);
    }
  }
  
  // Test avec jsonwebtoken (comme dans les scripts)
  console.log('\nTest avec jsonwebtoken:');
  for (const secret of possibleSecrets) {
    if (!secret) continue;
    
    try {
      const result = jwt.verify(token, secret);
      console.log(`✅ Succès avec clé: ${secret.substring(0, 20)}...`);
      console.log('Payload vérifié:', result);
    } catch (error) {
      console.log(`❌ Échec avec clé: ${secret.substring(0, 20)}...`);
      console.log('  Erreur:', error.message);
    }
  }
}

debugJWT(); 