import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.EMAIL || 'noah.lugagne@free.fr'
  console.log(`\n🔍 Vérification abonnement pour: ${email}`)

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        trialStatus: true,
        trialStartDate: true,
        trialEndDate: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        subscriptionEndDate: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        cancelledAt: true,
        convertedAt: true,
      }
    })

    if (!user) {
      console.error('❌ Utilisateur introuvable')
      process.exitCode = 1
      return
    }

    console.log('\n👤 Utilisateur:')
    console.log(`   🆔 ${user.id}`)
    console.log(`   📧 ${user.email}`)

    console.log('\n🧪 Trial:')
    console.log(`   Statut: ${user.trialStatus}`)
    console.log(`   Début:  ${user.trialStartDate?.toISOString() || '—'}`)
    console.log(`   Fin:    ${user.trialEndDate?.toISOString() || '—'}`)

    console.log('\n💳 Abonnement:')
    console.log(`   Statut: ${user.subscriptionStatus}`)
    console.log(`   Palier: ${user.subscriptionTier || '—'}`)
    console.log(`   Fin en: ${user.subscriptionEndDate?.toISOString() || '—'}`)
    console.log(`   Stripe customer: ${user.stripeCustomerId || '—'}`)
    console.log(`   Stripe subscription: ${user.stripeSubscriptionId || '—'}`)
    console.log(`   Converti le: ${user.convertedAt?.toISOString() || '—'}`)
    console.log(`   Annulé le:  ${user.cancelledAt?.toISOString() || '—'}`)

    const isPaid = user.subscriptionStatus === 'active' && (!!user.subscriptionEndDate && user.subscriptionEndDate > new Date())
    console.log(`\n✅ Est abonné actif: ${isPaid ? 'OUI' : 'NON'}`)
  } catch (err) {
    console.error('❌ Erreur:', err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()


