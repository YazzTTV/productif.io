const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addTestCheckIns() {
  try {
    const user = await prisma.user.findFirst({
      where: { whatsappNumber: { not: null } }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      process.exit(1)
    }

    console.log(`📊 Création de check-ins de test pour: ${user.email}`)

    // Simuler 7 jours de check-ins
    const now = new Date()
    const checkIns = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Matin - mood et energy
      checkIns.push({
        userId: user.id,
        timestamp: new Date(date.setHours(9, 15)),
        type: 'mood',
        value: 7 + Math.floor(Math.random() * 3),
        triggeredBy: 'manual',
        context: {}
      })

      checkIns.push({
        userId: user.id,
        timestamp: new Date(date.setHours(9, 20)),
        type: 'energy',
        value: 6 + Math.floor(Math.random() * 3),
        triggeredBy: 'manual',
        context: {}
      })

      // Après-midi - focus et motivation
      checkIns.push({
        userId: user.id,
        timestamp: new Date(date.setHours(14, 30)),
        type: 'focus',
        value: 6 + Math.floor(Math.random() * 3),
        triggeredBy: 'manual',
        context: {}
      })

      checkIns.push({
        userId: user.id,
        timestamp: new Date(date.setHours(14, 35)),
        type: 'motivation',
        value: 7 + Math.floor(Math.random() * 2),
        triggeredBy: 'manual',
        context: {}
      })

      // Soir - mood et stress
      checkIns.push({
        userId: user.id,
        timestamp: new Date(date.setHours(18, 15)),
        type: 'mood',
        value: 6 + Math.floor(Math.random() * 3),
        triggeredBy: 'manual',
        context: {}
      })

      checkIns.push({
        userId: user.id,
        timestamp: new Date(date.setHours(18, 20)),
        type: 'stress',
        value: 3 + Math.floor(Math.random() * 3),
        triggeredBy: 'manual',
        context: {}
      })
    }

    // Nettoyer les anciens check-ins de test
    await prisma.behaviorCheckIn.deleteMany({
      where: {
        userId: user.id,
        triggeredBy: 'manual'
      }
    })

    await prisma.behaviorCheckIn.createMany({ data: checkIns })

    console.log(`✅ ${checkIns.length} check-ins de test créés`)
    console.log('📊 Période: 7 derniers jours (simulés)')
    console.log('🎯 Vous pouvez maintenant tester avec: node scripts/test-behavior-api.js')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

addTestCheckIns()
