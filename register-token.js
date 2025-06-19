const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiN2NhNTczMjg1ZjU2YzQ3MmJmYmMxZjQyZmIzNGM3OWIiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsIm9iamVjdGl2ZXM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl19.V4Z8uAVz66vWatrdOh71AdVZMqZO5R1H7q4TTOZhMKo';

async function registerToken() {
  try {
    // Décoder le token pour obtenir les informations
    const [headerB64, payloadB64] = TOKEN.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    console.log('📝 Informations du token:');
    console.log('   - Token ID:', payload.tokenId);
    console.log('   - User ID:', payload.userId);
    console.log('   - Scopes:', payload.scopes);
    
    // Vérifier si le token existe déjà
    const existingToken = await prisma.apiToken.findUnique({
      where: { id: payload.tokenId }
    });
    
    if (existingToken) {
      console.log('\n✅ Le token existe déjà dans la base de données');
      return;
    }
    
    // Créer le token dans la base de données
    const apiToken = await prisma.apiToken.create({
      data: {
        id: payload.tokenId,
        name: 'Token WhatsApp',
        token: TOKEN,
        userId: payload.userId,
        scopes: payload.scopes,
        description: 'Token pour l\'intégration WhatsApp'
      }
    });
    
    console.log('\n✅ Token enregistré avec succès:');
    console.log('   - ID:', apiToken.id);
    console.log('   - Nom:', apiToken.name);
    console.log('   - Description:', apiToken.description);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

registerToken(); 