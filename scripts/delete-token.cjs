const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TOKEN_ID = '10dd40162d38c55b8f6d092525cf4b90';

async function deleteToken() {
  try {
    await prisma.apiToken.delete({
      where: { id: TOKEN_ID }
    });
    console.log('✅ Token supprimé avec succès');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteToken(); 