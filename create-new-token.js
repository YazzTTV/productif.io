const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = "un_secret_tres_securise_pour_jwt_tokens";

// Utiliser le même ID et les mêmes données que le token existant
const TOKEN_ID = "7ca573285f56c472bfbc1f42fb34c79b";
const USER_ID = "cma6li3j1000ca64sisjbjyfs";
const SCOPES = [
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

async function createNewToken() {
  try {
    // 1. Créer le payload
    const payload = {
      tokenId: TOKEN_ID,
      userId: USER_ID,
      scopes: SCOPES
    };

    // 2. Signer le token avec le bon secret
    const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });

    console.log('🔐 NOUVEAU TOKEN GÉNÉRÉ:');
    console.log(token);
    console.log();

    // 3. Vérifier le token
    const verified = jwt.verify(token, JWT_SECRET);
    console.log('✅ Vérification du token:');
    console.log('   - Token ID:', verified.tokenId);
    console.log('   - User ID:', verified.userId);
    console.log('   - Scopes:', verified.scopes);
    console.log();

    // 4. Mettre à jour le token dans la base de données
    const updatedToken = await prisma.apiToken.update({
      where: { id: TOKEN_ID },
      data: { token }
    });

    console.log('✅ Token mis à jour dans la base de données:');
    console.log('   - ID:', updatedToken.id);
    console.log('   - Nom:', updatedToken.name);
    console.log('   - User ID:', updatedToken.userId);

  } catch (error) {
    console.error('❌ ERREUR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNewToken(); 