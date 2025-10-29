import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkScheduleTiming() {
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
      console.log('❌ Schedule non configuré')
      process.exit(1)
    }

    console.log('📅 Configuration du Schedule:\n')
    console.log(`✅ Activé: ${schedule.enabled ? 'OUI' : 'NON'}`)
    console.log(`🔄 Fréquence: ${schedule.frequency}`)
    console.log(`🎲 Randomisation: ${schedule.randomize ? 'ACTIVÉE (±15min)' : 'DÉSACTIVÉE'}`)
    console.log(`📅 Week-ends: ${schedule.skipWeekends ? 'IGNORÉS' : 'INCLUS'}`)
    console.log(`\n⏰ Horaires de check-ins:\n`)

    const schedules = schedule.schedules || []
    
    schedules.forEach((sched, idx) => {
      console.log(`${idx + 1}. 📍 ${sched.time}`)
      console.log(`   Types: ${sched.types.join(', ')}`)
      
      if (schedule.randomize) {
        const [hour, minute] = sched.time.split(':').map(Number)
        const minTime = new Date()
        minTime.setHours(hour, Math.max(0, minute - 15), 0, 0)
        const maxTime = new Date()
        maxTime.setHours(hour, Math.min(59, minute + 15), 0, 0)
        
        console.log(`   ⏰ Envoi entre: ${minTime.getHours()}:${String(minTime.getMinutes()).padStart(2, '0')} et ${maxTime.getHours()}:${String(maxTime.getMinutes()).padStart(2, '0')}`)
      } else {
        console.log(`   ⏰ Envoi à: ${sched.time} exactement`)
      }
      console.log()
    })

    console.log('💡 Les questions sont envoyées automatiquement à ces horaires')
    console.log('📱 Vous recevrez une question aléatoire parmi les types configurés')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

checkScheduleTiming()
