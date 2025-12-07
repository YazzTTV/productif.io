import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetTrialForUser() {
  const email = process.env.EMAIL || process.argv[2]

  if (!email) {
    console.error('❌ Fournissez un email via EMAIL=... ou en argument CLI')
    process.exitCode = 1
    return
  }

  console.log(`\n🔄 Réinitialisation du free trial pour: ${email}`)

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      console.error('❌ Utilisateur introuvable')
      process.exitCode = 1
      return
    }

    const now = new Date()
    const trialEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        trialStartDate: now,
        trialEndDate,
        trialStatus: 'active',
        subscriptionStatus: 'trial',
        subscriptionEndDate: null,
        stripeSubscriptionId: null,
        cancelledAt: null,
        convertedAt: null,
      },
      select: {
        id: true,
        email: true,
        trialStartDate: true,
        trialEndDate: true,
        trialStatus: true,
        subscriptionStatus: true,
      },
    })

    console.log('✅ Free trial réinitialisé:')
    console.log(`   🆔 ID: ${updated.id}`)
    console.log(`   📧 Email: ${updated.email}`)
    console.log(`   ⏱️ Début: ${updated.trialStartDate?.toISOString()}`)
    console.log(`   ⏳ Fin:   ${updated.trialEndDate?.toISOString()}`)
    console.log(`   🔖 Statut trial: ${updated.trialStatus}`)
    console.log(`   💼 Statut subscription: ${updated.subscriptionStatus}`)
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du trial:', error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

resetTrialForUser()

