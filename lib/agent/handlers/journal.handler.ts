import { whatsappService } from '@/lib/whatsapp'
import { VoiceTranscriptionService } from '@/src/services/ai/VoiceTranscriptionService'
import { FlexibleMatcher } from '@/lib/utils/FlexibleMatcher'

/**
 * Détecte si un message transcrit est une demande de journaling explicite
 */
export function isJournalingIntent(text: string): boolean {
  const lower = text.toLowerCase()
  
  // Mots-clés explicites de journaling
  const journalKeywords = [
    'journal',
    'journée',
    'journee',
    'note de sa journée',
    'note de ma journée',
    'note de la journée',
    'note de journée',
    'raconter ma journée',
    'raconter ma journee',
    'récap de ma journée',
    'recap de ma journee'
  ]
  
  // Indicateurs de narration de journée
  const dayNarrativeIndicators = [
    'aujourd\'hui',
    'aujourdhui',
    'ce matin',
    'ce soir',
    'cette journée',
    'ma journée',
    'ma journee'
  ]
  
  // Patterns de note de journée (ex: "6/10", "6 sur 10")
  const ratingPatterns = [
    /\d+\s*\/\s*10/i,
    /\d+\s+sur\s+10/i,
    /note\s+de\s+\d+/i,
    /journée\s+\d+/i
  ]
  
  // Mots qui excluent le journaling (questions générales)
  const exclusionPatterns = [
    /^quelles?\s+sont/i,
    /^quels?\s+sont/i,
    /^qu\'est[- ]ce/i,
    /^c\'est\s+quoi/i,
    /^explique/i,
    /^montre/i,
    /^donne/i,
    /^aide/i
  ]
  
  // Exclure les questions qui ne sont pas des demandes de journaling
  const isQuestion = exclusionPatterns.some(pattern => pattern.test(text.trim()))
  if (isQuestion) {
    // Vérifier si c'est quand même une question sur le journaling
    const isJournalQuestion = journalKeywords.some(keyword => lower.includes(keyword))
    if (!isJournalQuestion) {
      return false
    }
  }
  
  // Vérifier les mots-clés explicites
  const hasJournalKeyword = journalKeywords.some(keyword => lower.includes(keyword))
  if (hasJournalKeyword) {
    return true
  }
  
  // Vérifier les patterns de note
  const hasRating = ratingPatterns.some(pattern => pattern.test(text))
  if (hasRating) {
    // Si une note est présente ET des indicateurs de journée, c'est probablement un journaling
    const hasDayIndicator = dayNarrativeIndicators.some(indicator => lower.includes(indicator))
    if (hasDayIndicator) {
      return true
    }
  }
  
  // Vérifier si c'est une narration de journée (au moins 2 indicateurs)
  const dayIndicatorCount = dayNarrativeIndicators.filter(indicator => lower.includes(indicator)).length
  if (dayIndicatorCount >= 2) {
    // C'est probablement une narration de journée, mais vérifier que ce n'est pas une question
    if (!isQuestion) {
      return true
    }
  }
  
  return false
}

/**
 * Transcrit un message vocal et retourne le texte transcrit
 */
export async function transcribeVoiceMessage(
  audioId: string,
  phoneNumber: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    await whatsappService.sendMessage(
      phoneNumber,
      "🎙️ J'ai bien reçu ton vocal ! Je vais l'analyser… ⏳"
    )

    const voice = new VoiceTranscriptionService()
    const result = await voice.processVoiceMessage(audioId, process.env.WHATSAPP_ACCESS_TOKEN || '')

    if (!result.success || !result.text) {
      return { success: false, error: result.error || 'Transcription échouée' }
    }

    return { success: true, text: result.text }
  } catch (error: any) {
    console.error('Erreur transcription vocal:', error)
    return { success: false, error: error?.message || 'Erreur transcription' }
  }
}

export async function handleJournalVoiceNote(
  audioId: string,
  userId: string,
  phoneNumber: string,
  apiToken: string,
  transcribedText?: string // Texte déjà transcrit optionnel
) {
  try {
    let transcriptionText: string
    
    if (transcribedText) {
      // Utiliser le texte déjà transcrit
      transcriptionText = transcribedText
    } else {
      // Transcrire le message vocal
      const transcriptionResult = await transcribeVoiceMessage(audioId, phoneNumber)
      if (!transcriptionResult.success || !transcriptionResult.text) {
        throw new Error(transcriptionResult.error || 'Transcription échouée')
      }
      transcriptionText = transcriptionResult.text
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/journal/agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transcription: transcriptionText, date: new Date().toISOString() })
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
  // Utiliser le système de matching flexible
  const journalMatch = FlexibleMatcher.matchesCommand(message, 'journal')
  if (journalMatch.matches && journalMatch.confidence >= 0.7) {
    const lower = message.toLowerCase()
    
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


