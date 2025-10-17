import { generateApiToken } from './lib/api-token.ts';
import { prisma } from './lib/prisma.ts';

async function createJournalingToken() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }
    
    console.log('👤 Utilisateur trouvé:', user.email);
    
    const { token } = await generateApiToken({
      name: 'Test Journaling',
      userId: user.id,
      description: 'Token de test pour le journaling vocal',
      scopes: ['journal:read', 'journal:write', 'deepwork:read', 'deepwork:write', 'tasks:read', 'tasks:write']
    });
    
    console.log('✅ Token généré avec scopes journaling:');
    console.log(token);
    console.log('');
    console.log('🧪 Test API:');
    console.log(`curl -X POST "http://localhost:3000/api/journal/agent" \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"transcription":"test journaling"}'`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createJournalingToken();
