import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateScheduleTime() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        whatsappNumber: { contains: '33783642205' }
      }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      process.exit(1)
    }

    const schedule = await prisma.checkInSchedule.findUnique({
      where: { userId: user.id }
    })

    if (!schedule) {
      console.log('❌ Schedule non trouvé')
      process.exit(1)
    }

    // Modifier les horaires
    const updatedSchedules = [
      {
        time: '09:00',
        types: ['mood', 'energy']
      },
      {
        time: '14:30',
        types: ['focus', 'motivation']
      },
      {
        time: '17:00',
        types: ['mood', 'stress']
      }
    ]

    await prisma.checkInSchedule.update({
      where: { userId: user.id },
      data: {
        schedules: updatedSchedules
      }
    })

    console.log('✅ Schedule mis à jour !\n')
    console.log('📅 Nouveaux horaires :')
    updatedSchedules.forEach((sched, idx) => {
      console.log(`${idx + 1}. ${sched.time} → ${sched.types.join(', ')}`)
    })

    const now = new Date()
    const targetTime = new Date()
    const [hour, minute] = '14:30'.split(':').map(Number)
    targetTime.setHours(hour, minute, 0, 0)

    const diffMs = targetTime - now
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin > 0) {
      console.log(`\n⏰ La prochaine question arrivera dans ${diffMin} minute(s) à 14:30`)
    } else {
      console.log('\n⚠️  L\'heure est déjà passée. La question sera envoyée demain à 14:30')
      console.log('💡 Pour tester immédiatement, utilise: node scripts/test-scheduler-manual.js')
    }

    console.log('\n🔄 Redémarre le scheduler pour appliquer les changements:')
    console.log('   npm run start:scheduler')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

updateScheduleTime()

