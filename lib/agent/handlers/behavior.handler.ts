import { whatsappService } from '@/lib/whatsapp'
import prisma from '@/lib/prisma'

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

export async function handleBehaviorCheckInCommand(
  message: string,
  userId: string,
  phoneNumber: string,
  apiToken: string
): Promise<boolean> {
  const lowerMessage = message.toLowerCase()

  // Commandes pour voir l'analyse
  if (lowerMessage.includes('analyse') || lowerMessage.includes('rapport') || lowerMessage.includes('pattern')) {
    return await sendBehaviorAnalysis(userId, phoneNumber, apiToken)
  }

  // Commandes pour voir les tendances
  if (lowerMessage.includes('tendance') || lowerMessage.includes('évolution')) {
    return await sendTrends(userId, phoneNumber, apiToken)
  }

  // Check si c'est une réponse à une question de check-in
  const awaitingState = await getUserConversationState(userId)
  if (awaitingState?.state?.startsWith('awaiting_checkin_')) {
    const type = awaitingState.state.replace('awaiting_checkin_', '')
    return await processCheckInResponse(message, type, userId, phoneNumber, apiToken)
  }

  return false
}

export async function triggerScheduledCheckIn(
  userId: string,
  phoneNumber: string,
  types: string[]
) {
  // Récupérer les préférences
  const schedule = await prisma.checkInSchedule.findUnique({
    where: { userId }
  })

  if (!schedule?.enabled) return

  // Choisir un type aléatoire parmi ceux proposés
  const type = types[Math.floor(Math.random() * types.length)]

  // Choisir une question aléatoire
  const questions = QUESTION_TEMPLATES[type as keyof typeof QUESTION_TEMPLATES]
  const question = questions[Math.floor(Math.random() * questions.length)]

  // Enregistrer l'état conversationnel
  await setUserConversationState(userId, `awaiting_checkin_${type}`)

  await whatsappService.sendMessage(phoneNumber, question)
}

async function processCheckInResponse(
  message: string,
  type: string,
  userId: string,
  phoneNumber: string,
  apiToken: string
) {
  // Extraire la valeur numérique
  const match = message.match(/(\d+)/)
  if (!match) {
    await whatsappService.sendMessage(
      phoneNumber,
      '🤔 Réponds simplement avec un chiffre de 1 à 10 !'
    )
    return true
  }

  const value = parseInt(match[1])
  if (value < 1 || value > 10) {
    await whatsappService.sendMessage(
      phoneNumber,
      '📊 Le chiffre doit être entre 1 et 10. Réessaye !'
    )
    return true
  }

  // Enregistrer le check-in
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/behavior/agent/checkin`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type, value, triggeredBy: 'scheduled' })
    }
  )

  if (response.ok) {
    const feedback = generateFeedback(type, value)
    await whatsappService.sendMessage(phoneNumber, feedback)

    // Nettoyer l'état
    await clearUserConversationState(userId)
  } else {
    await whatsappService.sendMessage(
      phoneNumber,
      '❌ Oups, erreur d\'enregistrement. Réessaye plus tard !'
    )
  }

  return true
}

function generateFeedback(type: string, value: number): string {
  const emoji = getTypeEmoji(type)
  
  if (value >= 8) {
    return `${emoji} Super ! ${value}/10 - Continue comme ça ! 🎉`
  } else if (value >= 5) {
    return `${emoji} Ok, ${value}/10 enregistré. Tu peux faire mieux ! 💪`
  } else {
    return `${emoji} ${value}/10... Prends soin de toi ! 🫂\n\nBesoin d'une pause ?`
  }
}

function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    mood: '😊',
    focus: '🎯',
    motivation: '🔥',
    energy: '⚡',
    stress: '😰'
  }
  return emojis[type] || '📊'
}

async function sendBehaviorAnalysis(
  userId: string,
  phoneNumber: string,
  apiToken: string
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/behavior/agent/analysis?days=7`,
    {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    }
  )

  const { pattern } = await response.json()

  if (!pattern || pattern.insights.length === 0) {
    await whatsappService.sendMessage(
      phoneNumber,
      '📊 Continue à répondre aux questions quotidiennes pour recevoir ton analyse comportementale !'
    )
    return true
  }

  let message = `📊 **Ton analyse des 7 derniers jours**\n\n`

  // Moyennes
  message += `📈 **Moyennes:**\n`
  message += `😊 Humeur: ${pattern.avgMood?.toFixed(1) || 'N/A'}/10\n`
  message += `🎯 Focus: ${pattern.avgFocus?.toFixed(1) || 'N/A'}/10\n`
  message += `🔥 Motivation: ${pattern.avgMotivation?.toFixed(1) || 'N/A'}/10\n`
  message += `⚡ Énergie: ${pattern.avgEnergy?.toFixed(1) || 'N/A'}/10\n`
  message += `😰 Stress: ${pattern.avgStress?.toFixed(1) || 'N/A'}/10\n\n`

  // Insights
  if (pattern.insights.length > 0) {
    message += `💡 **Insights clés:**\n`
    pattern.insights.forEach((insight: string, idx: number) => {
      message += `${idx + 1}. ${insight}\n`
    })
    message += `\n`
  }

  // Recommandations
  if (pattern.recommendations.length > 0) {
    message += `🎯 **Recommandations:**\n`
    pattern.recommendations.forEach((rec: string, idx: number) => {
      message += `${idx + 1}. ${rec}\n`
    })
  }

  await whatsappService.sendMessage(phoneNumber, message)
  return true
}

async function sendTrends(
  userId: string,
  phoneNumber: string,
  apiToken: string
) {
  // Récupérer les check-ins des 7 derniers jours
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/behavior/agent/checkin?days=7`,
    {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    }
  )

  const { checkIns } = await response.json()

  if (!checkIns || checkIns.length < 3) {
    await whatsappService.sendMessage(
      phoneNumber,
      '📊 Pas assez de données pour afficher les tendances. Continue à répondre aux questions !'
    )
    return true
  }

  // Grouper par type et calculer tendances
  const byType: Record<string, number[]> = {}
  checkIns.forEach((ci: any) => {
    if (!byType[ci.type]) byType[ci.type] = []
    byType[ci.type].push(ci.value)
  })

  let message = `📈 **Tes tendances sur 7 jours**\n\n`

  Object.entries(byType).forEach(([type, values]) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0
    const trendEmoji = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️'
    const emoji = getTypeEmoji(type)

    message += `${emoji} **${capitalize(type)}**: ${avg.toFixed(1)}/10 ${trendEmoji}\n`
  })

  await whatsappService.sendMessage(phoneNumber, message)
  return true
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Helpers pour l'état conversationnel
async function getUserConversationState(userId: string) {
  return await prisma.userConversationState.findUnique({
    where: { userId }
  }).catch(() => null)
}

async function setUserConversationState(userId: string, state: string) {
  await prisma.userConversationState.upsert({
    where: { userId },
    create: {
      userId,
      state,
      data: {}
    },
    update: {
      state,
      data: {}
    }
  })
}

async function clearUserConversationState(userId: string) {
  await prisma.userConversationState.delete({
    where: { userId }
  }).catch(() => {})
}
