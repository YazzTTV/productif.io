import axios from 'axios'
import { PrismaClient } from '@prisma/client'

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

/**
 * Envoie une question de check-in programmée
 * @param {string} userId - ID de l'utilisateur
 * @param {string} phoneNumber - Numéro WhatsApp
 * @param {string[]} types - Types de check-in à proposer
 */
export async function triggerScheduledCheckIn(userId, phoneNumber, types) {
  try {
    // Choisir un type aléatoire parmi ceux proposés
    const randomType = types[Math.floor(Math.random() * types.length)]
    
    // Choisir une question aléatoire pour ce type
    const questions = QUESTION_TEMPLATES[randomType] || []
    if (questions.length === 0) {
      console.error(`❌ Aucune question trouvée pour le type: ${randomType}`)
      return
    }
    
    const question = questions[Math.floor(Math.random() * questions.length)]
    
    // Enregistrer l'état conversationnel
    await prisma.userConversationState.upsert({
      where: { userId },
      create: {
        userId,
        state: `awaiting_checkin_${randomType}`,
        data: { type: randomType, timestamp: new Date().toISOString() }
      },
      update: {
        state: `awaiting_checkin_${randomType}`,
        data: { type: randomType, timestamp: new Date().toISOString() }
      }
    })
    
    // Envoyer la question via WhatsApp
    await sendWhatsAppMessage(phoneNumber, question)
    
    console.log(`✅ Question envoyée à ${phoneNumber}: ${randomType}`)
  } catch (error) {
    console.error(`❌ Erreur triggerScheduledCheckIn:`, error.message)
  }
}

/**
 * Envoie un message WhatsApp
 */
async function sendWhatsAppMessage(to, message) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  
  if (!phoneNumberId || !accessToken) {
    console.error('❌ Configuration WhatsApp manquante')
    return
  }
  
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
  
  await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: message }
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  )
}

export default {
  triggerScheduledCheckIn
}

