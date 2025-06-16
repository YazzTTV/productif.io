const { PrismaClient } = require('@prisma/client');
// const { verify } = require('../lib/jwt');

const prisma = new PrismaClient();

const TOKEN_ID = '10dd40162d38c55b8f6d092525cf4b90';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMTBkZDQwMTYyZDM4YzU1YjhmNmQwOTI1MjVjZjRiOTAiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl19.X1CQMOsCBvk9DxUzUogguU9ruFKN0aaHUa44R6dpmM0';

async function checkToken() {
  console.log('🔍 Recherche du token dans la base de données...\n');

  try {
    // Rechercher par ID
    console.log('1️⃣ Recherche par ID:', TOKEN_ID);
    const tokenById = await prisma.apiToken.findUnique({
      where: { id: TOKEN_ID }
    });
    console.log('Résultat:', tokenById || 'Non trouvé');
    console.log();
    
    // Rechercher par token complet
    console.log('2️⃣ Recherche par token complet');
    const tokenByValue = await prisma.apiToken.findUnique({
      where: { token: TOKEN }
    });
    console.log('Résultat:', tokenByValue || 'Non trouvé');
    console.log();
    
    // Lister tous les tokens
    console.log('3️⃣ Liste de tous les tokens:');
    const allTokens = await prisma.apiToken.findMany({
      select: {
        id: true,
        name: true,
        token: true,
        userId: true,
        scopes: true
      }
    });
    console.log('Nombre de tokens:', allTokens.length);
    allTokens.forEach((t, i) => {
      console.log(`\nToken ${i + 1}:`);
      console.log('- ID:', t.id);
      console.log('- Name:', t.name);
      console.log('- User ID:', t.userId);
      console.log('- Scopes:', t.scopes);
      console.log('- Token (début):', t.token.substring(0, 50) + '...');
    });

    // 5. Note sur JWT
    console.log('\n🔐 Note: Vérification JWT désactivée dans ce script (problème d\'import)');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkToken();
}

module.exports = { checkToken }; 