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

    // Modifier le 2ème horaire pour 12:37
    const updatedSchedules = [...schedule.schedules]
    updatedSchedules[1] = {
      time: '12:37',
      types: ['focus', 'motivation']
    }

    await prisma.checkInSchedule.update({
      where: { userId: user.id },
      data: {
        schedules: updatedSchedules
      }
    })

    console.log('✅ Schedule mis à jour pour test immédiat !\n')
    console.log('📅 Nouveaux horaires :')
    updatedSchedules.forEach((sched, idx) => {
      console.log(`${idx + 1}. ${sched.time} → ${sched.types.join(', ')}`)
    })

    const now = new Date()
    const targetTime = new Date()
    const [hour, minute] = '12:37'.split(':').map(Number)
    targetTime.setHours(hour, minute, 0, 0)

    const diffMs = targetTime - now
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin > 0) {
      console.log(`\n⏰ La prochaine question arrivera dans ${diffMin} minute(s) à 12:37`)
    } else {
      console.log('\n⚠️  L\'heure est déjà passée. La question sera envoyée demain à 12:37')
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

