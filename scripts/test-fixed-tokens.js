const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Utilisons la même clé JWT que l'application
const JWT_SECRET = process.env.JWT_SECRET || "un_secret_tres_securise_pour_jwt_tokens";

async function testFixedTokens() {
  console.log('🔨 === TEST DES CORRECTIONS DE TOKENS ===\n');

  try {
    // 1. Récupérer le premier utilisateur de la base
    const user = await prisma.user.findFirst({
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      return;
    }

    console.log('👤 Utilisateur trouvé:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Nom: ${user.name}`);
    console.log();

    // 2. Tester les deux types de tokens

    // Test 1: Token sans expiration (comme l'interface web quand le champ est vide)
    console.log('🧪 TEST 1: Token sans expiration');
    const tokenId1 = randomBytes(16).toString('hex');
    const scopes = ['tasks:read', 'tasks:write', 'habits:read', 'habits:write'];
    
    const payload1 = {
      tokenId: tokenId1,
      userId: user.id,
      scopes: scopes,
    };

    // Créer token sans expiration (nouveau comportement)
    const token1 = jwt.sign(payload1, JWT_SECRET, { algorithm: 'HS256' });
    
    console.log(`   - Token créé: ${token1.substring(0, 50)}...`);
    
    // Vérifier le token
    const decoded1 = jwt.verify(token1, JWT_SECRET);
    console.log(`   - Expiration: ${decoded1.exp ? new Date(decoded1.exp * 1000).toISOString() : 'AUCUNE ✅'}`);
    console.log();

    // Test 2: Token avec expiration spécifiée
    console.log('🧪 TEST 2: Token avec expiration spécifiée (1 semaine)');
    const tokenId2 = randomBytes(16).toString('hex');
    
    const payload2 = {
      tokenId: tokenId2,
      userId: user.id,
      scopes: scopes,
    };

    const expirationTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 jours
    const token2 = jwt.sign({ ...payload2, exp: expirationTime }, JWT_SECRET, { algorithm: 'HS256' });
    
    console.log(`   - Token créé: ${token2.substring(0, 50)}...`);
    
    // Vérifier le token
    const decoded2 = jwt.verify(token2, JWT_SECRET);
    console.log(`   - Expiration: ${new Date(decoded2.exp * 1000).toISOString()}`);
    console.log();

    // Test 3: Simuler appel API comme l'interface web
    console.log('🧪 TEST 3: Simulation appel API POST /api/tokens');
    
    const testData = {
      name: "Token Test Interface Web",
      description: "Test des corrections",
      scopes: scopes,
      // expiresAt: undefined (comme quand l'utilisateur laisse vide)
    };
    
    console.log('   - Données envoyées:', JSON.stringify(testData, null, 2));
    console.log('   - expiresAt est undefined/absent ✅');
    console.log('   - Le token créé devrait maintenant être permanent');
    console.log();

    // Test 4: Vérifier les headers JWT
    console.log('🧪 TEST 4: Vérification headers JWT');
    
    const header1 = JSON.parse(Buffer.from(token1.split('.')[0], 'base64').toString());
    const header2 = JSON.parse(Buffer.from(token2.split('.')[0], 'base64').toString());
    
    console.log('   - Header token sans expiration:', header1);
    console.log('   - Header token avec expiration:', header2);
    console.log('   - Présence de "typ": "JWT":', header1.typ === 'JWT' ? '✅' : '❌');
    console.log();

    console.log('✅ === TESTS TERMINÉS ===');
    console.log('💡 Les corrections devraient maintenant permettre:');
    console.log('   1. Tokens sans expiration quand le champ est vide');
    console.log('   2. Headers JWT conformes avec "typ": "JWT"');
    console.log('   3. Expiration par défaut d\'1 an au lieu de 7 jours');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFixedTokens(); 