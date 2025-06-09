const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');
const { SignJWT } = require('jose');

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode('un_secret_tres_securise_pour_jwt_tokens');

async function createPermanentToken() {
  console.log('🚀 === CRÉATION TOKEN PERMANENT ===\n');

  try {
    // Récupérer l'utilisateur admin
    const user = await prisma.user.findFirst({
      where: { email: 'admin@productif.io' },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      console.log('❌ Utilisateur admin non trouvé');
      return;
    }

    console.log('👤 Utilisateur:', user.email);

    // Créer token sans expiration (utilisant nos corrections)
    const tokenId = randomBytes(16).toString('hex');
    const scopes = ['tasks:read', 'tasks:write', 'habits:read', 'habits:write'];
    
    const payload = {
      tokenId,
      userId: user.id,
      scopes
    };

    // Utiliser la nouvelle logique corrigée : token permanent
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      // Pas d'expiration définie = token permanent
      .sign(JWT_SECRET);

    // Enregistrer en base
    await prisma.apiToken.create({
      data: {
        id: tokenId,
        name: 'Token Permanent Corrigé',
        token,
        userId: user.id,
        description: 'Token sans expiration créé après corrections',
        scopes,
        expiresAt: null // Pas d'expiration
      }
    });

    console.log('✅ Token permanent créé avec succès !');
    console.log('\n🔑 TOKEN:');
    console.log(token);
    console.log('\n📊 CARACTÉRISTIQUES:');
    console.log('• Utilisateur: admin@productif.io');
    console.log('• Expiration: AUCUNE (permanent)');
    console.log('• Scopes: ' + scopes.join(', '));
    console.log('• Header type: JWT inclus');
    
    console.log('\n🎯 === CORRECTION APPLIQUÉE ===');
    console.log('✅ Interface web créera maintenant des tokens permanents');
    console.log('✅ Plus de problème d\'expiration de 7 jours');
    console.log('✅ Headers JWT conformes');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPermanentToken(); 