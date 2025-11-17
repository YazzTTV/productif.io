import { PrismaClient } from '@prisma/client'
import { subDays } from 'date-fns'

const prisma = new PrismaClient()

async function checkProductivityMetrics() {
  try {
    // Récupérer l'email depuis les arguments
    const email = process.argv[2]
    
    if (!email) {
      console.error('❌ Usage: npx tsx scripts/check-productivity-metrics.ts <email>')
      process.exit(1)
    }

    console.log(`\n🔍 Recherche de l'utilisateur: ${email}\n`)

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.error(`❌ Utilisateur non trouvé avec l'email: ${email}`)
      process.exit(1)
    }

    console.log(`✅ Utilisateur trouvé: ${user.name || user.email} (ID: ${user.id})\n`)

    // Récupérer les check-ins des 7 derniers jours
    const sevenDaysAgo = subDays(new Date(), 7)
    const recentCheckIns = await prisma.behaviorCheckIn.findMany({
      where: {
        userId: user.id,
        type: {
          in: ['energy', 'focus', 'stress']
        },
        timestamp: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    console.log('📊 STATISTIQUES DE PRODUCTIVITY METRICS\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📅 Période: ${sevenDaysAgo.toLocaleDateString('fr-FR')} à ${new Date().toLocaleDateString('fr-FR')}`)
    console.log(`📝 Total de check-ins trouvés: ${recentCheckIns.length}\n`)

    if (recentCheckIns.length === 0) {
      console.log('❌ Aucun check-in trouvé pour cette période.')
      console.log('💡 Les données proviennent des réponses à l\'agent IA (WhatsApp).')
      console.log('💡 Assurez-vous que l\'agent IA pose des questions et que vous y répondez.\n')
      process.exit(0)
    }

    // Séparer par type
    const energyCheckIns = recentCheckIns.filter(c => c.type === 'energy')
    const focusCheckIns = recentCheckIns.filter(c => c.type === 'focus')
    const stressCheckIns = recentCheckIns.filter(c => c.type === 'stress')

    // Calculer les moyennes
    const energyLevel = energyCheckIns.length > 0
      ? Math.round((energyCheckIns.reduce((sum, c) => sum + c.value, 0) / energyCheckIns.length) * 10)
      : 0

    const focusLevel = focusCheckIns.length > 0
      ? Math.round((focusCheckIns.reduce((sum, c) => sum + c.value, 0) / focusCheckIns.length) * 10)
      : 0

    const stressLevel = stressCheckIns.length > 0
      ? Math.round((stressCheckIns.reduce((sum, c) => sum + c.value, 0) / stressCheckIns.length) * 10)
      : 0

    console.log('📈 RÉSULTATS CALCULÉS:\n')
    console.log(`⚡ Energy: ${energyLevel}% (${energyCheckIns.length} check-ins)`)
    if (energyCheckIns.length > 0) {
      const avg = energyCheckIns.reduce((sum, c) => sum + c.value, 0) / energyCheckIns.length
      console.log(`   Moyenne brute: ${avg.toFixed(2)}/10`)
    }
    
    console.log(`🧠 Focus: ${focusLevel}% (${focusCheckIns.length} check-ins)`)
    if (focusCheckIns.length > 0) {
      const avg = focusCheckIns.reduce((sum, c) => sum + c.value, 0) / focusCheckIns.length
      console.log(`   Moyenne brute: ${avg.toFixed(2)}/10`)
    }
    
    console.log(`😰 Stress: ${stressLevel}% (${stressCheckIns.length} check-ins)`)
    if (stressCheckIns.length > 0) {
      const avg = stressCheckIns.reduce((sum, c) => sum + c.value, 0) / stressCheckIns.length
      console.log(`   Moyenne brute: ${avg.toFixed(2)}/10`)
    }

    const productivityScore = Math.round(
      (energyLevel + focusLevel + (100 - stressLevel)) / 3
    )

    console.log(`\n🎯 Productivity Score: ${productivityScore}%`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Afficher les derniers check-ins
    if (recentCheckIns.length > 0) {
      console.log('📋 LES 10 DERNIERS CHECK-INS:\n')
      recentCheckIns.slice(0, 10).forEach((checkIn, index) => {
        const emoji = {
          energy: '⚡',
          focus: '🧠',
          stress: '😰'
        }[checkIn.type] || '📊'
        
        const date = new Date(checkIn.timestamp).toLocaleString('fr-FR')
        console.log(`${index + 1}. ${emoji} ${checkIn.type.toUpperCase()}: ${checkIn.value}/10`)
        console.log(`   📅 ${date}`)
        if (checkIn.note) {
          console.log(`   📝 Note: ${checkIn.note}`)
        }
        console.log('')
      })
    }

    console.log('✅ Script terminé')

  } catch (error) {
    console.error('💥 Erreur lors de l\'exécution du script:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProductivityMetrics()

