const { PrismaClient } = require('@prisma/client');
const { jwtVerify } = require('jose');
const { TextEncoder } = require('util');

const prisma = new PrismaClient();
const JWT_SECRET = "un_secret_tres_securise_pour_jwt_tokens";

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiYzQ0MTVlNTgyNmY4ZDVlNTFhNGExM2U3ZDU1OTE4YzAiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl19.KgM1WTxtexVMWKgWl1yykjeM7rtwg_-2s5C7PutdoTc';

async function debugToken() {
  try {
    // 1. Décoder le token
    const [headerB64, payloadB64] = TOKEN.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    console.log('📝 INFORMATIONS DU TOKEN:');
    console.log('   - Token ID:', payload.tokenId);
    console.log('   - User ID:', payload.userId);
    console.log('   - Scopes:', payload.scopes);
    
    // 2. Vérifier la signature JWT avec jose
    console.log('\n🔐 VÉRIFICATION JWT:');
    try {
      const secretBytes = new TextEncoder().encode(JWT_SECRET);
      const { payload: verified } = await jwtVerify(TOKEN, secretBytes);
      console.log('   ✅ Signature JWT valide');
      console.log('   📋 Payload vérifié:', verified);
    } catch (error) {
      console.log('   ❌ Signature JWT invalide:', error.code);
    }
    
    // 3. Vérifier dans la base de données
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
    
    if (tokenById) {
      console.log('\n📋 DÉTAILS DU TOKEN EN BASE:');
      console.log('   - ID:', tokenById.id);
      console.log('   - Nom:', tokenById.name);
      console.log('   - Description:', tokenById.description);
      console.log('   - User ID:', tokenById.userId);
      console.log('   - Scopes:', tokenById.scopes);
      console.log('   - Créé le:', tokenById.createdAt);
      console.log('   - Dernière utilisation:', tokenById.lastUsed);
      console.log('   - Expire le:', tokenById.expiresAt);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugToken(); 