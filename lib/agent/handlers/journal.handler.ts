import { whatsappService } from '@/lib/whatsapp'
import { VoiceTranscriptionService } from '@/src/services/ai/VoiceTranscriptionService'

export async function handleJournalVoiceNote(
  audioId: string,
  userId: string,
  phoneNumber: string,
  apiToken: string
) {
  try {
    await whatsappService.sendMessage(
      phoneNumber,
      "🎙️ J'ai bien reçu ton vocal ! Je vais l'analyser… ⏳"
    )

    const voice = new VoiceTranscriptionService()
    const result = await voice.processVoiceMessage(audioId, process.env.WHATSAPP_ACCESS_TOKEN || '')

    if (!result.success || !result.text) {
      throw new Error(result.error || 'Transcription échouée')
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/journal/agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transcription: result.text, date: new Date().toISOString() })
    })

    if (!response.ok) {
      throw new Error('Erreur enregistrement journal')
    }

    const data = await response.json()
    await whatsappService.sendMessage(phoneNumber, data?.message || "📔 Journal reçu !")
    return true
  } catch (error) {
    console.error('Erreur traitement vocal journal:', error)
    await whatsappService.sendMessage(
      phoneNumber,
      "❌ Oups, je n'ai pas pu traiter ton vocal. Réessaye dans quelques instants."
    )
    return true
  }
}

export async function handleJournalTextCommand(
  message: string,
  userId: string,
  phoneNumber: string,
  apiToken: string
) {
  const lower = message.toLowerCase()

  if (lower.includes('journal') || lower.includes('journée') || lower.includes('journale')) {
    if (lower.includes('résumé') || lower.includes('resume') || lower.includes('recap')) {
      return await sendJournalSummary(userId, phoneNumber, apiToken)
    }
    if (lower.includes('conseil') || lower.includes('améliorer') || lower.includes('ameliorer')) {
      return await sendDailyInsights(userId, phoneNumber, apiToken)
    }

    await whatsappService.sendMessage(
      phoneNumber,
      '📔 **Journal quotidien**\n\n' +
        "🎙️ Envoie-moi un vocal pour raconter ta journée\n" +
        '📊 Écris "résumé journal" pour voir tes dernières entrées\n' +
        '💡 Écris "conseils du jour" pour recevoir mes recommandations'
    )
    return true
  }

  return false
}

async function sendJournalSummary(userId: string, phoneNumber: string, apiToken: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/journal/agent?days=7`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  })
  const { entries } = await response.json()

  if (!entries || entries.length === 0) {
    await whatsappService.sendMessage(
      phoneNumber,
      "📔 Tu n'as pas encore d'entrées de journal.\n\nEnvoie-moi un vocal ce soir pour commencer ! 🎙️"
    )
    return true
  }

  let msg = `📊 **Tes 7 derniers jours**\n\n`
  entries.forEach((entry: any) => {
    const date = new Date(entry.date).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
    const emoji = entry.sentiment === 'positive' ? '😊' : entry.sentiment === 'negative' ? '😔' : '😐'
    msg += `${emoji} **${date}**\n`
    if (entry.highlights?.length > 0) {
      msg += `✨ ${entry.highlights[0]}\n`
    }
    msg += `\n`
  })

  await whatsappService.sendMessage(phoneNumber, msg)
  return true
}

async function sendDailyInsights(userId: string, phoneNumber: string, apiToken: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/journal/insights`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  })
  const { insight } = await response.json()

  if (!insight || (Array.isArray(insight.recommendations) && insight.recommendations.length === 0)) {
    await whatsappService.sendMessage(
      phoneNumber,
      '💡 Continue à noter tes journées pendant quelques jours, je pourrai ensuite te donner des conseils personnalisés ! 📈'
    )
    return true
  }

  let message = `🌅 **Tes axes d'amélioration**\n\n`
  if (Array.isArray(insight.focusAreas) && insight.focusAreas.length > 0) {
    message += `🎯 **Concentre-toi sur :**\n`
    insight.focusAreas.forEach((area: string) => {
      message += `• ${area}\n`
    })
    message += `\n`
  }
  message += `💡 **Mes recommandations :**\n`
  insight.recommendations.forEach((rec: string, idx: number) => {
    message += `${idx + 1}. ${rec}\n`
  })

  await whatsappService.sendMessage(phoneNumber, message)
  return true
}


