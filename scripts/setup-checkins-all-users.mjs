import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupCheckInsForAllUsers() {
  try {
    console.log('🔍 Recherche de tous les utilisateurs avec WhatsApp activé...\n')

    // Trouver tous les utilisateurs avec WhatsApp activé
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { whatsappNumber: { not: null } },
          { notificationSettings: { whatsappEnabled: true, whatsappNumber: { not: null } } }
        ]
      },
      include: {
        notificationSettings: true
      }
    })

    console.log(`✅ ${users.length} utilisateur(s) trouvé(s) avec WhatsApp\n`)

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur avec WhatsApp trouvé')
      process.exit(0)
    }

    let created = 0
    let updated = 0
    let skipped = 0

    for (const user of users) {
      try {
        const phoneNumber = user.whatsappNumber || user.notificationSettings?.whatsappNumber
        const whatsappEnabled = user.notificationSettings?.whatsappEnabled || !!user.whatsappNumber

        if (!phoneNumber || !whatsappEnabled) {
          console.log(`⏭️  ${user.email || user.id}: WhatsApp non configuré, ignoré`)
          skipped++
          continue
        }

        // Vérifier si un schedule existe déjà
        const existing = await prisma.checkInSchedule.findUnique({
          where: { userId: user.id }
        })

        const defaultSchedule = {
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

        if (existing) {
          // Mettre à jour si désactivé
          if (!existing.enabled) {
            await prisma.checkInSchedule.update({
              where: { userId: user.id },
              data: {
                enabled: true,
                ...defaultSchedule
              }
            })
            console.log(`🔄 ${user.email || user.id}: Schedule activé et mis à jour`)
            updated++
          } else {
            console.log(`✓  ${user.email || user.id}: Schedule déjà actif`)
            skipped++
          }
        } else {
          // Créer un nouveau schedule
          await prisma.checkInSchedule.create({
            data: {
              userId: user.id,
              ...defaultSchedule
            }
          })
          console.log(`✨ ${user.email || user.id}: Nouveau schedule créé`)
          created++
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${user.email || user.id}:`, error.message)
      }
    }

    console.log(`\n📊 Résumé:`)
    console.log(`   ✨ Créés: ${created}`)
    console.log(`   🔄 Mis à jour: ${updated}`)
    console.log(`   ✓  Déjà configurés: ${skipped}`)
    console.log(`\n✅ Configuration terminée !`)
    console.log(`\n💡 Tous les utilisateurs recevront maintenant des questions de check-in:`)
    console.log(`   - ~9h00 : humeur, énergie`)
    console.log(`   - ~14h00 : focus, motivation`)
    console.log(`   - ~18h00 : stress, énergie`)
    console.log(`\n🔄 Redémarre le scheduler pour appliquer les changements`)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

setupCheckInsForAllUsers()

