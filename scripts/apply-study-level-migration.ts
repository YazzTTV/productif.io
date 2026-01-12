import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔄 Application de la migration studyLevel...');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "OnboardingData" 
      ADD COLUMN IF NOT EXISTS "studyLevel" INTEGER;
    `);
    
    console.log('✅ Migration appliquée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
