const { PrismaClient } = require('@prisma/client');
const { SignJWT } = require('jose');
const { TextEncoder } = require('util');

const prisma = new PrismaClient();
const JWT_SECRET = "un_secret_tres_securise_pour_jwt_tokens";

async function registerToken() {
  try {
    // Préparer les données du token
    const tokenId = '7ca573285f56c472bfbc1f42fb34c79b';
    const userId = 'cma6li3j1000ca64sisjbjyfs';
    const scopes = [
      'habits:read',
      'tasks:read',
      'objectives:read',
      'projects:read',
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

    // Mettre à jour le token dans la base de données
    const apiToken = await prisma.apiToken.update({
      where: { id: tokenId },
      data: {
        token,
        lastUsed: new Date()
      }
    });

    console.log('✅ Token mis à jour avec succès');
    console.log('Token:', token);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

registerToken(); 