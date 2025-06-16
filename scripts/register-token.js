import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMTBkZDQwMTYyZDM4YzU1YjhmNmQwOTI1MjVjZjRiOTAiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl19.X1CQMOsCBvk9DxUzUogguU9ruFKN0aaHUa44R6dpmM0';

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
        name: 'Token de test',
        token: TOKEN,
        userId: payload.userId,
        scopes: payload.scopes,
        description: 'Token créé pour tester l\'API debug'
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