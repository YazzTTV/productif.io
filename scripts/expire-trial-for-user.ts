import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function expireTrialForUser() {
  try {
    const email = 'test4654321@free.fr'
    
    console.log(`🔍 Recherche de l'utilisateur: ${email}`)
    
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        trialStartDate: true,
        trialEndDate: true,
        trialStatus: true,
        subscriptionStatus: true
      }
    })

    if (!user) {
      console.error(`❌ Utilisateur ${email} non trouvé`)
      return
    }

    console.log(`✅ Utilisateur trouvé: ${user.name || user.email}`)
    console.log(`   - ID: ${user.id}`)
    console.log(`   - Trial Status: ${user.trialStatus}`)
    console.log(`   - Subscription Status: ${user.subscriptionStatus}`)
    console.log(`   - Trial End Date: ${user.trialEndDate?.toISOString() || 'N/A'}`)

    // Mettre fin au trial en mettant la date de fin dans le passé
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // Hier

    await prisma.user.update({
      where: { id: user.id },
      data: {
        trialEndDate: pastDate,
        trialStatus: 'expired',
        subscriptionStatus: 'expired'
      }
    })

    console.log(`\n✅ Trial expiré avec succès pour ${email}`)
    console.log(`   - Nouvelle date de fin: ${pastDate.toISOString()}`)
    console.log(`   - Nouveau statut trial: expired`)
    console.log(`   - Nouveau statut subscription: expired`)
    console.log(`\n🎯 L'utilisateur n'aura plus accès à l'application`)

  } catch (error) {
    console.error('❌ Erreur lors de l\'expiration du trial:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
expireTrialForUser()

