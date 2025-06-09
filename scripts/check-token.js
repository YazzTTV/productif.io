const { PrismaClient } = require('@prisma/client');
// const { verify } = require('../lib/jwt');

const prisma = new PrismaClient();

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0b2tlbklkIjoiM2Y5NDZjZjQ4YmQ2MGJkMjgyYzdiYjM0ZDU1ODQwMTciLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsImhhYml0czp3cml0ZSIsInRhc2tzOndyaXRlIl0sImV4cCI6MTc1MDA5NTE1Nn0.1hBjNoIhlDBkJ1TCA6oNfo2FosXFJDarhibAWCYPtDY';

async function checkToken() {
  console.log('🔍 === VÉRIFICATION DU TOKEN API ===\n');

  try {
    // 1. Décoder le token sans vérification pour voir le contenu
    const parts = TOKEN.split('.');
    if (parts.length !== 3) {
      console.log('❌ Token mal formé');
      return;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('📋 Payload du token:');
    console.log('   - Token ID:', payload.tokenId);
    console.log('   - User ID:', payload.userId);
    console.log('   - Scopes:', payload.scopes);
    console.log('   - Expiration:', payload.exp ? new Date(payload.exp * 1000) : 'Non définie');
    console.log('   - Émis le:', payload.iat ? new Date(payload.iat * 1000) : 'Non défini');
    console.log();

    // 2. Vérifier si le token est expiré
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < now;
      console.log(`⏰ Expiration: ${isExpired ? '❌ Expiré' : '✅ Valide'}`);
      if (isExpired) {
        console.log(`   Expiré depuis: ${Math.floor((now - payload.exp) / 60)} minutes`);
      }
      console.log();
    }

    // 3. Vérifier dans la base de données
    console.log('🔍 Recherche dans la base de données...');
    
    // Chercher par tokenId
    const tokenById = await prisma.apiToken.findUnique({
      where: { id: payload.tokenId }
    });

    console.log(`📋 Token par ID: ${tokenById ? '✅ Trouvé' : '❌ Non trouvé'}`);
    if (tokenById) {
      console.log('   - Nom:', tokenById.name);
      console.log('   - Créé le:', tokenById.createdAt);
      console.log('   - Dernière utilisation:', tokenById.lastUsed || 'Jamais');
      console.log('   - Expire le:', tokenById.expiresAt || 'Jamais');
    }

    // Chercher par token complet
    const tokenByValue = await prisma.apiToken.findUnique({
      where: { token: TOKEN }
    });

    console.log(`📋 Token par valeur: ${tokenByValue ? '✅ Trouvé' : '❌ Non trouvé'}`);
    console.log();

    // 4. Lister tous les tokens de cet utilisateur
    const userTokens = await prisma.apiToken.findMany({
      where: { userId: payload.userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsed: true,
        expiresAt: true,
        scopes: true
      }
    });

    console.log(`📋 Tous les tokens de l'utilisateur: ${userTokens.length}`);
    userTokens.forEach((token, index) => {
      console.log(`   ${index + 1}. ${token.name} (${token.id})`);
      console.log(`      Créé: ${token.createdAt}`);
      console.log(`      Scopes: ${token.scopes.join(', ')}`);
    });

    // 5. Note sur JWT
    console.log('\n🔐 Note: Vérification JWT désactivée dans ce script (problème d\'import)');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkToken();
}

module.exports = { checkToken }; 