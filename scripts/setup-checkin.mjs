import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupCheckIn(userId) {
  try {
    console.log(`🔍 Vérification de la configuration check-in pour: ${userId}\n`)

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationSettings: true }
    })

    if (!user) {
      console.error(`❌ Utilisateur ${userId} non trouvé`)
      process.exit(1)
    }

    console.log(`✅ Utilisateur trouvé: ${user.email || user.id}`)
    console.log(`   WhatsApp: ${user.notificationSettings?.whatsappNumber || user.whatsappNumber || '❌ Non configuré'}`)
    console.log(`   WhatsApp activé: ${user.notificationSettings?.whatsappEnabled}\n`)

    // Vérifier la configuration existante
    const existing = await prisma.checkInSchedule.findUnique({
      where: { userId }
    })

    if (existing) {
      console.log(`📋 Configuration existante trouvée:`)
      console.log(`   Activé: ${existing.enabled}`)
      console.log(`   Fréquence: ${existing.frequency}`)
      console.log(`   Randomize: ${existing.randomize}`)
      console.log(`   Skip weekends: ${existing.skipWeekends}`)
      console.log(`   Horaires:`, JSON.stringify(existing.schedules, null, 2))
      
      console.log(`\n🔄 Mise à jour de la configuration...`)
      
      const updated = await prisma.checkInSchedule.update({
        where: { userId },
        data: {
          enabled: true,
          frequency: '3x_daily',
          randomize: true,
          skipWeekends: false,
          schedules: [
            { time: '09:00', types: ['mood', 'energy'] },
            { time: '14:00', types: ['focus', 'motivation'] },
            { time: '18:00', types: ['stress', 'energy'] }
          ]
        }
      })
      
      console.log(`✅ Configuration mise à jour !`)
    } else {
      console.log(`📋 Aucune configuration trouvée, création...`)
      
      const created = await prisma.checkInSchedule.create({
        data: {
          userId,
          enabled: true,
          frequency: '3x_daily',
          randomize: true,
          skipWeekends: false,
          schedules: [
            { time: '09:00', types: ['mood', 'energy'] },
            { time: '14:00', types: ['focus', 'motivation'] },
            { time: '18:00', types: ['stress', 'energy'] }
          ]
        }
      })
      
      console.log(`✅ Configuration créée !`)
    }

    console.log(`\n📊 Configuration finale:`)
    const final = await prisma.checkInSchedule.findUnique({
      where: { userId }
    })
    console.log(`   Activé: ${final.enabled}`)
    console.log(`   Fréquence: ${final.frequency}`)
    console.log(`   Horaires:`)
    final.schedules.forEach(s => {
      console.log(`      - ${s.time} : ${s.types.join(', ')}`)
    })

    console.log(`\n✅ Configuration terminée !`)
    console.log(`\n💡 Tu recevras maintenant des questions de check-in:`)
    console.log(`   - ~9h00 : humeur, énergie`)
    console.log(`   - ~14h00 : focus, motivation`)
    console.log(`   - ~18h00 : stress, énergie`)
    console.log(`\n🔄 Redémarre le scheduler pour appliquer les changements`)
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

const userId = process.argv[2]

if (!userId) {
  console.error('❌ Usage: node scripts/setup-checkin.mjs <userId>')
  process.exit(1)
}

setupCheckIn(userId)

