const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiN2NhNTczMjg1ZjU2YzQ3MmJmYmMxZjQyZmIzNGM3OWIiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsIm9iamVjdGl2ZXM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl0sImlhdCI6MTc1MDE2NTcyOH0.-J7hwUxfdlZ0tURL187_UIQrqBrjw8urSYtgxuTVZcw';

async function registerToken() {
  try {
    // Décoder le token pour obtenir les informations
    const [headerB64, payloadB64] = TOKEN.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    console.log('📝 Informations du token:');
    console.log('   - Token ID:', payload.tokenId);
    console.log('   - User ID:', payload.userId);
    console.log('   - Scopes:', payload.scopes.join(', '));
    
    // Vérifier si le token existe déjà
    const existingToken = await prisma.apiToken.findUnique({
      where: { id: payload.tokenId }
    });
    
    if (existingToken) {
      console.log('⚠️ Le token existe déjà dans la base de données');
      return;
    }
    
    // Créer le token dans la base de données
    const apiToken = await prisma.apiToken.create({
      data: {
        id: payload.tokenId,
        name: 'Token WhatsApp',
        description: 'Token pour l\'agent WhatsApp',
        token: TOKEN,
        userId: payload.userId,
        scopes: payload.scopes,
        lastUsed: new Date(),
        createdAt: new Date(payload.iat * 1000)
      }
    });
    
    console.log('✅ Token enregistré avec succès:', apiToken.id);
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement du token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

registerToken(); 