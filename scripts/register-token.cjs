const { PrismaClient } = require('@prisma/client');
const { SignJWT } = require('jose');
const { TextEncoder } = require('util');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "un_secret_tres_securise_pour_jwt_tokens";

async function registerToken() {
  try {
    // Préparer les données du token
    const tokenId = '10dd40162d38c55b8f6d092525cf4b90';
    const userId = 'cma6li3j1000ca64sisjbjyfs';
    const scopes = [
      'tasks:read',
      'habits:read',
      'projects:read',
      'objectives:read',
      'processes:read',
      'processes:write',
      'objectives:write',
      'projects:write',
      'tasks:write',
      'habits:write'
    ];

    // Créer le token avec jose
    const secretBytes = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({
      tokenId,
      userId,
      scopes
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(secretBytes);

    console.log('📝 Informations du token:');
    console.log('   - Token ID:', tokenId);
    console.log('   - User ID:', userId);
    console.log('   - Scopes:', scopes);
    
    // Vérifier si le token existe déjà
    const existingToken = await prisma.apiToken.findUnique({
      where: { id: tokenId }
    });
    
    if (existingToken) {
      console.log('\n✅ Le token existe déjà dans la base de données');
      return;
    }
    
    // Créer le token dans la base de données
    const apiToken = await prisma.apiToken.create({
      data: {
        id: tokenId,
        name: 'Token de test',
        token: token,
        userId: userId,
        scopes: scopes,
        description: 'Token créé pour tester l\'API debug'
      }
    });
    
    console.log('\n✅ Token enregistré avec succès:');
    console.log('   - ID:', apiToken.id);
    console.log('   - Nom:', apiToken.name);
    console.log('   - Description:', apiToken.description);
    console.log('   - Token:', token);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

registerToken(); 