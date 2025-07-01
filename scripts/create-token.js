import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';
import { TextEncoder } from 'util';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();
const JWT_SECRET = "un_secret_tres_securise_pour_jwt_tokens";

async function createToken() {
  try {
    // Générer un nouveau token ID
    const tokenId = randomBytes(16).toString('hex');
    
    // Définir les scopes
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

    // Créer le payload
    const payload = {
      tokenId,
      userId: 'cma6li3j1000ca64sisjbjyfs',
      scopes
    };

    // Créer le token avec jose
    const secretBytes = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(secretBytes);

    // Enregistrer dans la base de données
    const apiToken = await prisma.apiToken.create({
      data: {
        id: tokenId,
        name: 'Token WhatsApp',
        token,
        userId: payload.userId,
        scopes,
        description: 'Token pour l\'agent WhatsApp'
      }
    });

    console.log('✅ Token créé avec succès');
    console.log('Token:', token);
    console.log('ID:', tokenId);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createToken(); 