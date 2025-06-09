const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Utilisons la même clé JWT que l'application
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

async function createTestToken() {
  console.log('🔨 === CRÉATION D\'UN TOKEN API DE TEST ===\n');

  try {
    // 1. Récupérer le premier utilisateur de la base
    const user = await prisma.user.findFirst({
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      console.log('💡 Créez d\'abord un utilisateur via l\'interface web');
      return;
    }

    console.log('👤 Utilisateur trouvé:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Nom: ${user.name}`);
    console.log();

    // 2. Générer un nouveau token ID
    const tokenId = randomBytes(16).toString('hex');
    
    // 3. Définir les scopes pour tester les tâches
    const scopes = [
      'habits:read',
      'tasks:read', 
      'projects:read',
      'objectives:read',
      'processes:read',
      'processes:write',
      'objectives:write',
      'projects:write',
      'habits:write',
      'tasks:write'
    ];

    // 4. Créer le payload JWT
    const payload = {
      tokenId: tokenId,
      userId: user.id,
      scopes: scopes,
    };

    // 5. Signer le token (avec expiration dans 7 jours)
    const expirationTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 jours
    const token = jwt.sign(
      { ...payload, exp: expirationTime },
      JWT_SECRET,
      { algorithm: 'HS256' }
    );

    console.log('🔐 Token généré:');
    console.log(`   - Token ID: ${tokenId}`);
    console.log(`   - Expire le: ${new Date(expirationTime * 1000).toLocaleString('fr-FR')}`);
    console.log(`   - Scopes: ${scopes.length} permissions`);
    console.log();

    // 6. Enregistrer dans la base de données
    const apiToken = await prisma.apiToken.create({
      data: {
        id: tokenId,
        name: 'Token de test automatique',
        token: token,
        userId: user.id,
        description: 'Token créé automatiquement pour les tests API',
        scopes: scopes,
        expiresAt: null // Pas d'expiration en base (géré par JWT)
      }
    });

    console.log('✅ Token enregistré en base de données');
    console.log();

    // 7. Afficher le token pour copier-coller
    console.log('🎯 === TOKEN À UTILISER ===');
    console.log('=============================');
    console.log(token);
    console.log('=============================');
    console.log();

    // 8. Mise à jour des fichiers de test
    console.log('📝 Mise à jour des scripts de test...');
    
    const fs = require('fs');
    const path = require('path');
    
    const scriptsToUpdate = [
      'scripts/test-create-task.js',
      'scripts/test-single.js',
      'scripts/test-with-token.js'
    ];

    for (const scriptPath of scriptsToUpdate) {
      try {
        if (fs.existsSync(scriptPath)) {
          let content = fs.readFileSync(scriptPath, 'utf8');
          
          // Remplacer l'ancien token par le nouveau
          const tokenRegex = /const TOKEN = '[^']+';/;
          const newTokenLine = `const TOKEN = '${token}';`;
          
          if (tokenRegex.test(content)) {
            content = content.replace(tokenRegex, newTokenLine);
            fs.writeFileSync(scriptPath, content);
            console.log(`   ✅ ${scriptPath} mis à jour`);
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Erreur lors de la mise à jour de ${scriptPath}:`, error.message);
      }
    }

    console.log();
    console.log('🚀 === PRÊT POUR LES TESTS ===');
    console.log('============================');
    console.log('Vous pouvez maintenant utiliser:');
    console.log('   node scripts/test-create-task.js');
    console.log('   node scripts/test-single.js');
    console.log('   node scripts/test-with-token.js');

  } catch (error) {
    console.error('❌ Erreur lors de la création du token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createTestToken();
}

module.exports = { createTestToken }; 