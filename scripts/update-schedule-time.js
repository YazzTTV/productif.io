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

    // Modifier le 2ème horaire de 14:00 à 11:50
    const updatedSchedules = [...schedule.schedules]
    updatedSchedules[1] = {
      time: '11:50',
      types: ['focus', 'motivation']
    }

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

    console.log('\n⏰ Le 2ème check-in arrive maintenant à 11:50 au lieu de 14:00')
    console.log('💡 Parfait pour tester rapidement !')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

updateScheduleTime()
