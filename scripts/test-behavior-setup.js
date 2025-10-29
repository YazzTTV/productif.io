const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setupTestUser() {
  try {
    // Trouver un utilisateur avec WhatsApp
    const user = await prisma.user.findFirst({
      where: {
        whatsappNumber: { not: null }
      }
    })

    if (!user) {
      console.log('❌ Aucun utilisateur avec WhatsApp trouvé')
      console.log('💡 Créez d\'abord un utilisateur avec un numéro WhatsApp')
      process.exit(1)
    }

    console.log(`✅ Utilisateur trouvé: ${user.email}`)
    console.log(`📱 WhatsApp: ${user.whatsappNumber}`)

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
        randomize: false, // Pour les tests
        skipWeekends: false
      },
      update: {
        enabled: true
      }
    })

    console.log(`✅ CheckInSchedule configuré pour ${user.email}`)
    console.log(`📅 Check-ins planifiés:`, JSON.stringify(schedule.schedules, null, 2))

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

setupTestUser()
