import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getOnboardingData(userId) {
  try {
    if (!userId) {
      console.error('❌ Usage: node scripts/get-onboarding-data.mjs <userId>')
      console.log('\n💡 Pour trouver un userId, utilisez:')
      console.log('   node scripts/get-onboarding-data.mjs --list-users')
      process.exit(1)
    }

    if (userId === '--list-users') {
      // Lister tous les utilisateurs avec leurs données d'onboarding
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          onboardingData: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })

      console.log(`\n📊 ${users.length} utilisateur(s) trouvé(s):\n`)
      users.forEach(user => {
        console.log(`👤 ${user.email || user.id}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Nom: ${user.name || 'N/A'}`)
        if (user.onboardingData) {
          console.log(`   ✅ Données d'onboarding présentes`)
          console.log(`      - Objectif: ${user.onboardingData.mainGoal || 'N/A'}`)
          console.log(`      - Rôle: ${user.onboardingData.role || 'N/A'}`)
          console.log(`      - Langue: ${user.onboardingData.language || 'N/A'}`)
          console.log(`      - Étape: ${user.onboardingData.currentStep || 'N/A'}`)
          console.log(`      - Complété: ${user.onboardingData.completed ? 'Oui' : 'Non'}`)
        } else {
          console.log(`   ❌ Pas de données d'onboarding`)
        }
        console.log('')
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { onboardingData: true }
    })

    if (!user) {
      console.error(`❌ Utilisateur ${userId} non trouvé`)
      process.exit(1)
    }

    console.log(`\n👤 Utilisateur: ${user.email || user.id}`)
    console.log(`   Nom: ${user.name || 'N/A'}`)
    console.log(`   ID: ${user.id}\n`)

    if (!user.onboardingData) {
      console.log('❌ Aucune donnée d\'onboarding trouvée pour cet utilisateur')
      process.exit(0)
    }

    const data = user.onboardingData
    console.log('📋 Données d\'onboarding:\n')
    console.log('📝 Informations de base:')
    console.log(`   - Objectif principal: ${data.mainGoal || 'N/A'}`)
    console.log(`   - Rôle: ${data.role || 'N/A'}`)
    console.log(`   - Frustration: ${data.frustration || 'N/A'}`)
    console.log(`   - Langue: ${data.language || 'N/A'}\n`)

    console.log('📱 WhatsApp:')
    console.log(`   - Numéro: ${data.whatsappNumber || 'N/A'}`)
    console.log(`   - Consentement: ${data.whatsappConsent ? 'Oui' : 'Non'}\n`)

    console.log('🎯 Questionnaire de diagnostic:')
    console.log(`   - Comportement: ${data.diagBehavior || 'N/A'}`)
    console.log(`   - Sentiment fin de journée: ${data.timeFeeling || 'N/A'}`)
    console.log(`   - Habitude téléphone: ${data.phoneHabit || 'N/A'}\n`)

    console.log('📊 Métadonnées:')
    console.log(`   - Offre: ${data.offer || 'N/A'}`)
    console.log(`   - Email fallback: ${data.emailFallback || 'N/A'}`)
    console.log(`   - Cycle de facturation: ${data.billingCycle || 'N/A'}`)
    if (data.utmParams) {
      console.log(`   - Paramètres UTM: ${JSON.stringify(data.utmParams, null, 2)}`)
    }
    console.log('')

    console.log('📈 Progression:')
    console.log(`   - Étape actuelle: ${data.currentStep || 'N/A'}`)
    console.log(`   - Complété: ${data.completed ? 'Oui' : 'Non'}`)
    console.log(`   - Créé le: ${data.createdAt.toLocaleString('fr-FR')}`)
    console.log(`   - Mis à jour le: ${data.updatedAt.toLocaleString('fr-FR')}\n`)

    console.log('📄 Données complètes (JSON):')
    console.log(JSON.stringify(data, null, 2))

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const userId = process.argv[2]
getOnboardingData(userId)

