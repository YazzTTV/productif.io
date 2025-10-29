import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

async function testScheduler() {
  try {
    // Trouver l'utilisateur
    const searchPhone = '33783642205'
    const user = await prisma.user.findFirst({
      where: {
        whatsappNumber: { contains: searchPhone }
      },
      include: {
        notificationSettings: true
      }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      process.exit(1)
    }

    console.log(`✅ Utilisateur trouvé: ${user.email}`)
    console.log(`📱 WhatsApp: ${user.notificationSettings?.whatsappNumber}`)

    // Récupérer le schedule
    const schedule = await prisma.checkInSchedule.findUnique({
      where: { userId: user.id }
    })

    if (!schedule || !schedule.enabled) {
      console.log('❌ Schedule non configuré ou désactivé')
      process.exit(1)
    }

    console.log('📅 Schedule configuré')
    console.log('📋 Horaires:', JSON.stringify(schedule.schedules, null, 2))

    // Simuler un trigger de check-in
    const schedConfig = schedule.schedules
    const firstSchedule = schedConfig[0]

    if (!firstSchedule) {
      console.log('❌ Aucun schedule configuré')
      process.exit(1)
    }

    console.log(`\n🧪 Simulation d'un check-in à ${firstSchedule.time} avec types: ${firstSchedule.types.join(', ')}`)

    // Choisir un type aléatoire
    const types = firstSchedule.types
    const type = types[Math.floor(Math.random() * types.length)]

    const QUESTION_TEMPLATES = {
      mood: [
        '😊 Comment te sens-tu en ce moment ? (1-10)',
        '😊 Quelle est ton humeur actuellement ? (1-10)',
        '🌟 Comment évalues-tu ton humeur ? (1-10)'
      ],
      focus: [
        '🎯 Quel est ton niveau de concentration ? (1-10)',
        '🎯 Es-tu concentré en ce moment ? (1-10)',
        '🔍 Comment évalues-tu ta capacité de focus actuelle ? (1-10)'
      ],
      motivation: [
        '🔥 Quel est ton niveau de motivation ? (1-10)',
        '💪 Te sens-tu motivé(e) en ce moment ? (1-10)',
        '🚀 Comment est ta motivation aujourd\'hui ? (1-10)'
      ],
      energy: [
        '⚡ Quel est ton niveau d\'énergie ? (1-10)',
        '⚡ Comment te sens-tu niveau énergie ? (1-10)',
        '🔋 Évalue ton niveau d\'énergie actuel (1-10)'
      ],
      stress: [
        '😰 Quel est ton niveau de stress ? (1-10)',
        '😌 Te sens-tu stressé(e) ? (1-10)',
        '💆 Comment évalues-tu ton stress actuellement ? (1-10)'
      ]
    }

    const questions = QUESTION_TEMPLATES[type]
    const question = questions[Math.floor(Math.random() * questions.length)]

    console.log(`📤 Envoi de la question: ${question}`)

    // Envoyer la question via API WhatsApp
    const phoneNumber = user.notificationSettings?.whatsappNumber || ''
    const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0'
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_API_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
      console.log('❌ Variables WhatsApp non configurées')
      process.exit(1)
    }

    await axios.post(
      `${apiUrl}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber.replace(/\D/g, ''),
        type: 'text',
        text: {
          preview_url: false,
          body: question
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    console.log(`✅ Message envoyé à ${phoneNumber}`)

    // Enregistrer l'état conversationnel
    await prisma.userConversationState.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        state: `awaiting_checkin_${type}`,
        data: {}
      },
      update: {
        state: `awaiting_checkin_${type}`,
        data: {}
      }
    })

    console.log('✅ Question envoyée !')
    console.log(`📱 Vous devriez recevoir un message sur WhatsApp`)
    console.log(`\n💡 Testez ensuite en répondant avec un chiffre (1-10)`)
    console.log(`💬 Exemple: "8"`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

testScheduler()
