import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

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

async function testCheckIn(userId, typeOverride = null) {
  try {
    console.log(`🎯 Test d'envoi de check-in pour: ${userId}\n`)

    // Récupérer l'utilisateur et sa configuration
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        notificationSettings: true,
        checkInSchedule: true
      }
    })

    if (!user) {
      console.error(`❌ Utilisateur ${userId} non trouvé`)
      process.exit(1)
    }

    const phone = user.notificationSettings?.whatsappNumber || user.whatsappNumber
    const whatsappEnabled = user.notificationSettings?.whatsappEnabled

    console.log(`✅ Utilisateur: ${user.email || user.id}`)
    console.log(`📱 WhatsApp: ${phone}`)
    console.log(`✅ WhatsApp activé: ${whatsappEnabled}\n`)

    if (!phone || !whatsappEnabled) {
      console.error('❌ WhatsApp non configuré ou désactivé')
      process.exit(1)
    }

    if (!user.checkInSchedule?.enabled) {
      console.error('❌ Check-in schedule non activé')
      process.exit(1)
    }

    // Choisir un type de check-in
    const availableTypes = ['mood', 'focus', 'motivation', 'energy', 'stress']
    const type = typeOverride || availableTypes[Math.floor(Math.random() * availableTypes.length)]
    
    // Choisir une question aléatoire
    const questions = QUESTION_TEMPLATES[type]
    const question = questions[Math.floor(Math.random() * questions.length)]

    console.log(`📝 Type de check-in: ${type}`)
    console.log(`❓ Question: ${question}\n`)

    // Enregistrer l'état conversationnel
    await prisma.userConversationState.upsert({
      where: { userId },
      create: {
        userId,
        state: `awaiting_checkin_${type}`,
        data: { type, timestamp: new Date().toISOString(), source: 'test_script' }
      },
      update: {
        state: `awaiting_checkin_${type}`,
        data: { type, timestamp: new Date().toISOString(), source: 'test_script' }
      }
    })

    console.log(`✅ État conversationnel enregistré: awaiting_checkin_${type}\n`)

    // Envoyer via WhatsApp API
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_API_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0'

    if (!phoneNumberId || !accessToken) {
      console.error('❌ Variables WhatsApp non configurées (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)')
      process.exit(1)
    }

    console.log(`📤 Envoi du message WhatsApp...`)

    const response = await axios.post(
      `${apiUrl}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: question }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log(`✅ Message envoyé avec succès !`)
    console.log(`   Message ID: ${response.data.messages?.[0]?.id}\n`)

    console.log(`💡 Instructions:`)
    console.log(`1. Réponds avec un chiffre de 1 à 10 sur WhatsApp`)
    console.log(`2. L'AI agent enregistrera automatiquement ta réponse`)
    console.log(`3. Tu recevras un feedback sur ton score`)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.response) {
      console.error('   Détails:', JSON.stringify(error.response.data, null, 2))
    }
  } finally {
    await prisma.$disconnect()
  }
}

const userId = process.argv[2]
const type = process.argv[3] // optionnel: mood, focus, motivation, energy, stress

if (!userId) {
  console.error('❌ Usage: node scripts/test-checkin.mjs <userId> [type]')
  console.error('   Types disponibles: mood, focus, motivation, energy, stress')
  process.exit(1)
}

testCheckIn(userId, type)

