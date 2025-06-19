const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { jwtVerify } = require('jose');
const { TextEncoder } = require('util');

const prisma = new PrismaClient();
const JWT_SECRET = "un_secret_tres_securise_pour_jwt_tokens";

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiN2NhNTczMjg1ZjU2YzQ3MmJmYmMxZjQyZmIzNGM3OWIiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsIm9iamVjdGl2ZXM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl19.1RTGfenk6ydccbAvS925CTU-rbC6XUrNevA0hJkWIz4';

async function debugJWT() {
  try {
    // 1. Décoder le token
    const [headerB64, payloadB64] = TOKEN.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    console.log('📝 INFORMATIONS DU TOKEN:');
    console.log('   - Token ID:', payload.tokenId);
    console.log('   - User ID:', payload.userId);
    console.log('   - Scopes:', payload.scopes);
    
    // 2. Vérifier avec jsonwebtoken (comme dans les scripts)
    console.log('\n🔐 VÉRIFICATION AVEC JSONWEBTOKEN:');
    try {
      const verified = jwt.verify(TOKEN, JWT_SECRET);
      console.log('   ✅ Signature JWT valide');
      console.log('   📋 Payload vérifié:', verified);
    } catch (error) {
      console.log('   ❌ Signature JWT invalide:', error.message);
    }
    
    // 3. Vérifier avec jose (comme dans l'API)
    console.log('\n🔐 VÉRIFICATION AVEC JOSE:');
    try {
      const secretBytes = new TextEncoder().encode(JWT_SECRET);
      const { payload: verifiedPayload } = await jwtVerify(TOKEN, secretBytes);
      console.log('   ✅ Signature JWT valide');
      console.log('   📋 Payload vérifié:', verifiedPayload);
    } catch (error) {
      console.log('   ❌ Signature JWT invalide:', error.code);
    }
    
    // 4. Vérifier dans la base de données
    console.log('\n🔍 RECHERCHE EN BASE DE DONNÉES:');
    
    // Par ID
    const tokenById = await prisma.apiToken.findUnique({
      where: { id: payload.tokenId }
    });
    console.log('   Recherche par ID:', tokenById ? '✅ Trouvé' : '❌ Non trouvé');
    
    // Par token complet
    const tokenByValue = await prisma.apiToken.findUnique({
      where: { token: TOKEN }
    });
    console.log('   Recherche par token:', tokenByValue ? '✅ Trouvé' : '❌ Non trouvé');
    
    if (tokenById || tokenByValue) {
      const token = tokenById || tokenByValue;
      console.log('\n📋 DÉTAILS DU TOKEN EN BASE:');
      console.log('   - ID:', token.id);
      console.log('   - Nom:', token.name);
      console.log('   - Description:', token.description);
      console.log('   - User ID:', token.userId);
      console.log('   - Scopes:', token.scopes);
      console.log('   - Créé le:', token.createdAt);
      console.log('   - Dernière utilisation:', token.lastUsed);
      console.log('   - Expire le:', token.expiresAt);
    }
    
  } catch (error) {
    console.error('❌ ERREUR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugJWT(); 