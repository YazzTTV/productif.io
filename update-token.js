const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TOKEN_ID = '7ca573285f56c472bfbc1f42fb34c79b';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiN2NhNTczMjg1ZjU2YzQ3MmJmYmMxZjQyZmIzNGM3OWIiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsIm9iamVjdGl2ZXM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl0sImlhdCI6MTc1MDE2NTcyOH0.-J7hwUxfdlZ0tURL187_UIQrqBrjw8urSYtgxuTVZcw';

async function updateToken() {
  try {
    // Mettre à jour le token
    const updatedToken = await prisma.apiToken.update({
      where: { id: TOKEN_ID },
      data: {
        token: TOKEN,
        name: 'Token WhatsApp',
        description: 'Token pour l\'agent WhatsApp'
      }
    });
    
    console.log('✅ Token mis à jour avec succès:', updatedToken.id);
    console.log('   - Nom:', updatedToken.name);
    console.log('   - Description:', updatedToken.description);
    console.log('   - Token complet:', updatedToken.token);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateToken(); 