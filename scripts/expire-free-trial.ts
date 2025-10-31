import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function expireFreeTrial() {
  const email = process.env.EMAIL || 'noah.lugagne@free.fr'

  console.log(`\n🛑 Expiration du free trial et statut non payé pour: ${email}`)

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      console.error('❌ Utilisateur introuvable')
      process.exitCode = 1
      return
    }

    const now = new Date()

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        // Free trial expiré
        trialStatus: 'expired',
        trialEndDate: now,

        // Abonnement inexistant/inactif (comme si aucun paiement)
        subscriptionStatus: 'expired',
        subscriptionEndDate: now,
        stripeSubscriptionId: null,

        // Champs historiques
        convertedAt: null,
        cancelledAt: null,

        // Compatibilité (anciens champs)
        trialEndsAt: now,
      },
      select: {
        id: true,
        email: true,
        trialEndDate: true,
        trialStatus: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
      },
    })

    console.log('✅ État appliqué: utilisateur sans paiement et trial expiré')
    console.log(`   🆔 ID: ${updated.id}`)
    console.log(`   📧 Email: ${updated.email}`)
    console.log(`   ⏳ Trial fin: ${updated.trialEndDate?.toISOString()}`)
    console.log(`   🔖 Statut trial: ${updated.trialStatus}`)
    console.log(`   💼 Statut subscription: ${updated.subscriptionStatus}`)
    console.log(`   📆 Subscription fin: ${updated.subscriptionEndDate?.toISOString()}`)
  } catch (error) {
    console.error('❌ Erreur lors de l\'expiration du trial:', error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

expireFreeTrial()


