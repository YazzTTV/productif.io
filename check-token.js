const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TOKEN_ID = '7ca573285f56c472bfbc1f42fb34c79b';

async function checkToken() {
  try {
    // Récupérer le token de la base de données
    const token = await prisma.apiToken.findUnique({
      where: { id: TOKEN_ID }
    });
    
    if (!token) {
      console.log('❌ Token non trouvé dans la base de données');
      return;
    }
    
    console.log('📝 Token trouvé:');
    console.log('   - ID:', token.id);
    console.log('   - Nom:', token.name);
    console.log('   - Description:', token.description);
    console.log('   - User ID:', token.userId);
    console.log('   - Scopes:', token.scopes.join(', '));
    console.log('   - Dernière utilisation:', token.lastUsed);
    console.log('   - Créé le:', token.createdAt);
    console.log('   - Token:', token.token);
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkToken(); 