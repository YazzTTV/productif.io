import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()

  try {
    // 1. Récupérer ton utilisateur (par email)
    const user = await prisma.user.findUnique({
      where: { email: 'noah.lugagne@free.fr' },
      include: {
        notificationSettings: true
      }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé pour noah.lugagne@free.fr')
      return
    }

    if (!user.notificationSettings?.whatsappNumber) {
      console.log('❌ Cet utilisateur n’a pas de numéro WhatsApp configuré dans notificationSettings')
      return
    }

    // 2. Charger la configuration de check-in
    const schedule = await prisma.checkInSchedule.findUnique({
      where: { userId: user.id }
    })

    if (!schedule) {
      console.log('❌ Aucun schedule de check-in trouvé pour cet utilisateur')
      return
    }

    // 3. Import dynamique du handler JS (WhatsApp)
    const behaviorModule = await import('../lib/agent/handlers/behavior.handler.js')
    const triggerScheduledCheckIn = behaviorModule.triggerScheduledCheckIn

    if (!triggerScheduledCheckIn) {
      console.log('❌ triggerScheduledCheckIn non disponible dans behavior.handler.js')
      return
    }

    console.log('🧪 Envoi d’une question de check-in…')
    console.log('👤 Utilisateur :', user.email)
    console.log('📱 WhatsApp :', user.notificationSettings.whatsappNumber)

    const firstSchedule = Array.isArray((schedule as any).schedules)
      ? (schedule as any).schedules[0]
      : null

    if (!firstSchedule || !Array.isArray(firstSchedule.types) || firstSchedule.types.length === 0) {
      console.log('❌ Aucun type configuré dans checkInSchedule.schedules[0].types')
      return
    }

    // 4. Déclencher une question aléatoire (mood / focus / energy / stress…)
    await triggerScheduledCheckIn(
      user.id,
      user.notificationSettings.whatsappNumber,
      firstSchedule.types
    )

    console.log('✅ Question de check-in envoyée. Vérifie ton WhatsApp.')
  } catch (error) {
    console.error('❌ Erreur dans trigger-behavior-checkin.ts :', error)
  } finally {
    await new PrismaClient().$disconnect()
  }
}

main()




