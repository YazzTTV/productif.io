import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCheckIns() {
  try {
    const phoneNumber = '33783642205'
    const user = await prisma.user.findFirst({
      where: {
        whatsappNumber: { contains: phoneNumber }
      }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      process.exit(1)
    }

    console.log(`✅ Utilisateur: ${user.email}`)
    console.log(`\n📊 Récupération des check-ins...`)

    // Récupérer tous les check-ins
    const checkIns = await prisma.behaviorCheckIn.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
      take: 20
    })

    console.log(`\n✅ ${checkIns.length} check-ins trouvés\n`)

    if (checkIns.length === 0) {
      console.log('❌ Aucun check-in enregistré')
      process.exit(0)
    }

    // Afficher les 10 derniers
    console.log('📋 Les 10 derniers check-ins:\n')
    console.log('─'.repeat(80))

    checkIns.slice(0, 10).forEach((checkIn, idx) => {
      const date = new Date(checkIn.timestamp).toLocaleString('fr-FR')
      const emoji = {
        mood: '😊',
        focus: '🎯',
        motivation: '🔥',
        energy: '⚡',
        stress: '😰'
      }[checkIn.type] || '📊'

      console.log(`${idx + 1}. ${emoji} ${checkIn.type.toUpperCase()}: ${checkIn.value}/10`)
      console.log(`   📅 ${date}`)
      console.log(`   🏷️  Déclenché par: ${checkIn.triggeredBy}`)
      if (checkIn.note) {
        console.log(`   📝 Note: ${checkIn.note}`)
      }
      console.log('─'.repeat(80))
    })

    // Statistiques par type
    const stats = {
      mood: { total: 0, avg: 0 },
      focus: { total: 0, avg: 0 },
      motivation: { total: 0, avg: 0 },
      energy: { total: 0, avg: 0 },
      stress: { total: 0, avg: 0 }
    }

    checkIns.forEach(ci => {
      const type = ci.type
      if (stats[type]) {
        stats[type].total++
        stats[type].avg += ci.value
      }
    })

    console.log('\n📈 Statistiques par type:\n')
    Object.entries(stats).forEach(([type, data]) => {
      if (data.total > 0) {
        const avg = data.avg / data.total
        const emoji = {
          mood: '😊',
          focus: '🎯',
          motivation: '🔥',
          energy: '⚡',
          stress: '😰'
        }[type] || '📊'
        
        console.log(`${emoji} ${type.toUpperCase()}: ${data.total} check-ins, moyenne: ${avg.toFixed(1)}/10`)
      }
    })

    // Vérifier l'état conversationnel
    const conversationState = await prisma.userConversationState.findUnique({
      where: { userId: user.id }
    })

    console.log('\n💬 État conversationnel actuel:')
    if (conversationState) {
      console.log(`   ✅ État: ${conversationState.state}`)
      console.log(`   📅 Créé: ${new Date(conversationState.createdAt).toLocaleString('fr-FR')}`)
    } else {
      console.log('   ℹ️  Aucun état enregistré (normal si vous n\'avez pas de question en cours)')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

checkCheckIns()
