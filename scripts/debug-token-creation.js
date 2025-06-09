const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Utilisons plusieurs secrets possibles pour tester
const POSSIBLE_SECRETS = [
  process.env.JWT_SECRET,
  'your-super-secret-jwt-key',
  'your-secret-key',
  'default-secret'
];

async function testTokenCreation() {
  console.log('🔍 === DIAGNOSTIC CRÉATION DE TOKENS ===\n');

  try {
    // 1. Vérifier l'environnement
    console.log('1️⃣ Environnement:');
    console.log('   JWT_SECRET défini:', !!process.env.JWT_SECRET);
    console.log('   JWT_SECRET value:', process.env.JWT_SECRET?.substring(0, 10) + '...' || 'Non défini');
    console.log();

    // 2. Vérifier les utilisateurs disponibles
    console.log('2️⃣ Utilisateurs disponibles:');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    
    console.log(`   Trouvés: ${users.length} utilisateur(s)`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name}) - ID: ${user.id}`);
    });
    console.log();

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé - impossible de créer un token');
      return;
    }

    const testUser = users[0];

    // 3. Tester différents secrets
    console.log('3️⃣ Test des secrets JWT:');
    for (const secret of POSSIBLE_SECRETS) {
      if (!secret) continue;
      
      console.log(`   Test avec secret: ${secret.substring(0, 10)}...`);
      
      try {
        // Créer un token de test
        const tokenId = randomBytes(16).toString('hex');
        const payload = {
          tokenId,
          userId: testUser.id,
          scopes: ['habits:read', 'tasks:read']
        };
        
        const testToken = jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '7d' });
        
        // Tenter de vérifier le token
        const verified = jwt.verify(testToken, secret);
        
        console.log(`   ✅ Secret valide: ${secret.substring(0, 10)}...`);
        console.log(`   📝 Token créé: ${testToken.substring(0, 50)}...`);
        break;
        
      } catch (error) {
        console.log(`   ❌ Erreur avec secret: ${error.message}`);
      }
    }
    console.log();

    // 4. Vérifier les tokens existants
    console.log('4️⃣ Tokens existants en base:');
    const existingTokens = await prisma.apiToken.findMany({
      select: { 
        id: true, 
        name: true, 
        userId: true, 
        scopes: true, 
        createdAt: true,
        token: true
      },
      take: 5
    });
    
    console.log(`   Trouvés: ${existingTokens.length} token(s)`);
    existingTokens.forEach((token, index) => {
      console.log(`   ${index + 1}. ${token.name} - User: ${token.userId}`);
      console.log(`      Token: ${token.token.substring(0, 50)}...`);
      console.log(`      Créé: ${token.createdAt.toLocaleString('fr-FR')}`);
      
      // Tenter de décoder le token
      try {
        const decoded = jwt.decode(token.token, { complete: true });
        if (decoded) {
          console.log(`      Payload: TokenID=${decoded.payload.tokenId}, Exp=${decoded.payload.exp ? new Date(decoded.payload.exp * 1000).toLocaleString('fr-FR') : 'Jamais'}`);
        }
      } catch (e) {
        console.log(`      ⚠️  Décodage impossible: ${e.message}`);
      }
    });
    console.log();

    // 5. Test de création manuelle
    console.log('5️⃣ Test création manuelle:');
    const newTokenId = randomBytes(16).toString('hex');
    const newPayload = {
      tokenId: newTokenId,
      userId: testUser.id,
      scopes: ['habits:read', 'tasks:read', 'tasks:write']
    };

    // Utiliser le premier secret valide
    const workingSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    console.log(`   Utilisation du secret: ${workingSecret.substring(0, 10)}...`);

    const manualToken = jwt.sign(newPayload, workingSecret, { 
      algorithm: 'HS256', 
      expiresIn: '7d' 
    });

    console.log(`   Token généré: ${manualToken.substring(0, 50)}...`);

    // Sauvegarder en base
    try {
      const savedToken = await prisma.apiToken.create({
        data: {
          id: newTokenId,
          name: 'Token de test diagnostic',
          token: manualToken,
          userId: testUser.id,
          description: 'Token créé par le script de diagnostic',
          scopes: ['habits:read', 'tasks:read', 'tasks:write']
        }
      });

      console.log(`   ✅ Token sauvegardé en base: ${savedToken.id}`);
      console.log();

      // 6. Test de validation
      console.log('6️⃣ Test de validation:');
      try {
        const validated = jwt.verify(manualToken, workingSecret);
        console.log('   ✅ Token valide lors de la vérification');
        console.log('   📋 Payload:', validated);
      } catch (verifyError) {
        console.log('   ❌ Erreur de validation:', verifyError.message);
      }

      console.log('\n🎯 === TOKEN DE TEST CRÉÉ ===');
      console.log('=============================');
      console.log(`Email: ${testUser.email}`);
      console.log(`Token: ${manualToken}`);
      console.log('=============================');

    } catch (saveError) {
      console.log(`   ❌ Erreur sauvegarde: ${saveError.message}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTokenCreation(); 