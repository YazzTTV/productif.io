import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function setupUser() {
  try {
    // Trouver l'utilisateur par numéro WhatsApp
    const phoneNumber = '+33783642205'
    
    const user = await prisma.user.findFirst({
      where: {
        whatsappNumber: { contains: '783642205' }
      },
      include: {
        notificationSettings: true
      }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé avec ce numéro WhatsApp')
      console.log('💡 Recherche des utilisateurs existants...')
      
      const users = await prisma.user.findMany({
        where: { whatsappNumber: { not: null } },
        select: { email: true, whatsappNumber: true, id: true }
      })
      
      if (users.length > 0) {
        console.log('📋 Utilisateurs avec WhatsApp:', users)
      }
      
      process.exit(1)
    }

    console.log(`✅ Utilisateur trouvé: ${user.email}`)
    console.log(`📱 WhatsApp: ${user.whatsappNumber}`)

    // Vérifier les préférences de notification
    if (!user.notificationSettings?.whatsappEnabled) {
      console.log('⚠️ WhatsApp désactivé pour cet utilisateur')
      
      // Activer WhatsApp
      await prisma.notificationSettings.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          whatsappEnabled: true,
          whatsappNumber: phoneNumber
        },
        update: {
          whatsappEnabled: true,
          whatsappNumber: phoneNumber
        }
      })
      
      console.log('✅ WhatsApp activé pour cet utilisateur')
    }

    // Créer ou mettre à jour le schedule
    const schedule = await prisma.checkInSchedule.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        enabled: true,
        frequency: '3x_daily',
        schedules: [
          { time: '09:00', types: ['mood', 'energy'] },
          { time: '14:00', types: ['focus', 'motivation'] },
          { time: '18:00', types: ['mood', 'stress'] }
        ],
        randomize: false, // Pas de randomisation pour les tests
        skipWeekends: false
      },
      update: {
        enabled: true,
        randomize: false
      }
    })

    console.log(`✅ CheckInSchedule configuré pour ${user.email}`)
    console.log(`📅 Check-ins planifiés:`)
    schedule.schedules.forEach((sched, idx) => {
      console.log(`   ${idx + 1}. ${sched.time} → ${sched.types.join(', ')}`)
    })

    // Créer des check-ins de test (7 derniers jours)
    console.log('\n📊 Création de check-ins de test...')
    
    const checkIns = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Matin
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

      // Après-midi
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

      // Soir
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

    // Supprimer les anciens check-ins de test
    await prisma.behaviorCheckIn.deleteMany({
      where: {
        userId: user.id,
        triggeredBy: 'manual'
      }
    })

    await prisma.behaviorCheckIn.createMany({ data: checkIns })

    console.log(`✅ ${checkIns.length} check-ins de test créés (7 jours)`)

    // Compter les check-ins
    const total = await prisma.behaviorCheckIn.count({
      where: { userId: user.id }
    })
    console.log(`📊 Total check-ins pour cet utilisateur: ${total}`)

    console.log('\n🎉 Configuration terminée !')
    console.log('📱 Envoyez "analyse" depuis WhatsApp pour tester')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

setupUser()
