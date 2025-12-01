import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyCheckInScheduler() {
  try {
    console.log('🔍 Vérification du BehaviorCheckInScheduler\n')

    // 1. Vérifier les configurations actives
    const activeSchedules = await prisma.checkInSchedule.findMany({
      where: { enabled: true },
      include: {
        user: {
          include: {
            notificationSettings: true
          }
        }
      }
    })

    console.log(`📊 ${activeSchedules.length} configuration(s) active(s)\n`)

    activeSchedules.forEach((schedule, idx) => {
      const user = schedule.user
      const phone = user.notificationSettings?.whatsappNumber || user.whatsappNumber
      const whatsappEnabled = user.notificationSettings?.whatsappEnabled

      console.log(`${idx + 1}. Utilisateur: ${user.email || user.id}`)
      console.log(`   📱 WhatsApp: ${phone || '❌ Non configuré'}`)
      console.log(`   ✅ WhatsApp activé: ${whatsappEnabled}`)
      console.log(`   🔔 Check-in activé: ${schedule.enabled}`)
      console.log(`   🔀 Randomize: ${schedule.randomize}`)
      console.log(`   📅 Skip weekends: ${schedule.skipWeekends}`)
      console.log(`   ⏰ Horaires:`)
      
      if (Array.isArray(schedule.schedules)) {
        schedule.schedules.forEach(sched => {
          console.log(`      - ${sched.time} : ${sched.types.join(', ')}`)
        })
      } else {
        console.log(`      ⚠️ Aucun horaire défini`)
      }

      if (!phone || !whatsappEnabled) {
        console.log(`   ⚠️ ATTENTION: Cet utilisateur ne recevra PAS de check-ins (WhatsApp non configuré ou désactivé)`)
      } else {
        console.log(`   ✅ Cet utilisateur recevra des check-ins`)
      }
      console.log()
    })

    // 2. Vérifier les derniers check-ins
    console.log('\n📊 Derniers check-ins enregistrés:\n')
    
    const recentCheckIns = await prisma.behaviorCheckIn.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { email: true, id: true }
        }
      }
    })

    if (recentCheckIns.length === 0) {
      console.log('❌ Aucun check-in enregistré')
    } else {
      recentCheckIns.forEach((checkIn, idx) => {
        console.log(`${idx + 1}. ${checkIn.timestamp.toISOString()}`)
        console.log(`   Type: ${checkIn.type} | Valeur: ${checkIn.value}/10`)
        console.log(`   User: ${checkIn.user.email || checkIn.user.id}`)
        console.log(`   Trigger: ${checkIn.triggeredBy}`)
        console.log()
      })
    }

    // 3. Instructions
    console.log('\n📝 Instructions:\n')
    console.log('1. Redémarre le scheduler avec: npm run dev:scheduler')
    console.log('2. Vérifie les logs de démarrage pour voir:')
    console.log('   "✅ BehaviorCheckInScheduler démarré pour X utilisateurs"')
    console.log('3. Les check-ins seront envoyés aux horaires configurés (avec ±15min aléatoire)')
    console.log('4. Pour tester manuellement, utilise: node scripts/test-checkin.mjs <userId>')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifyCheckInScheduler()

