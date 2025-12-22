import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Ajout des colonnes inferredCategory et userCategoryOverride à la table habits...')
  
  try {
    // Exécuter le SQL directement
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "habits"
      ADD COLUMN IF NOT EXISTS "inferredCategory" TEXT,
      ADD COLUMN IF NOT EXISTS "userCategoryOverride" TEXT;
    `)
    
    console.log('✅ Colonnes ajoutées avec succès !')
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('ℹ️  Les colonnes existent déjà, pas besoin de les ajouter.')
    } else {
      console.error('❌ Erreur lors de l\'ajout des colonnes:', error)
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

