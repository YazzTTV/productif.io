import { whatsappService } from '@/lib/whatsapp'
import { FlexibleMatcher } from '@/lib/utils/FlexibleMatcher'

const userStates = new Map<string, { state: string; data?: any }>()

export async function handleDeepWorkCommand(
  message: string,
  userId: string,
  phoneNumber: string,
  apiToken: string
): Promise<boolean> {
  const currentState = userStates.get(userId)
  if (currentState?.state === 'awaiting_deepwork_duration') {
    return await processDurationResponse(message, userId, phoneNumber, apiToken)
  }

  // Utiliser le système de matching flexible pour détecter les commandes
  const startMatch = FlexibleMatcher.matchesCommand(message, 'start_deepwork')
  if (startMatch.matches && startMatch.confidence >= 0.7) {
    return await startDeepWorkSession(userId, phoneNumber, apiToken)
  }

  const endMatch = FlexibleMatcher.matchesCommand(message, 'end_deepwork')
  if (endMatch.matches && endMatch.confidence >= 0.7) {
    return await endDeepWorkSession(userId, phoneNumber, apiToken)
  }

  const pauseMatch = FlexibleMatcher.matchesCommand(message, 'pause_deepwork')
  if (pauseMatch.matches && pauseMatch.confidence >= 0.7) {
    return await pauseSession(userId, phoneNumber, apiToken)
  }

  const resumeMatch = FlexibleMatcher.matchesCommand(message, 'resume_deepwork')
  if (resumeMatch.matches && resumeMatch.confidence >= 0.7) {
    return await resumeSession(userId, phoneNumber, apiToken)
  }

  const statusMatch = FlexibleMatcher.matchesCommand(message, 'status_deepwork')
  if (statusMatch.matches && statusMatch.confidence >= 0.7) {
    return await getActiveSession(userId, phoneNumber, apiToken)
  }

  // Fallback pour l'historique (pas encore dans les variations)
  const lower = message.toLowerCase()
  if ((lower.includes('historique') || lower.includes('sessions')) && (lower.includes('deep work') || lower.includes('travail'))) {
    return await showHistory(userId, phoneNumber, apiToken)
  }

  return false
}

async function startDeepWorkSession(userId: string, phoneNumber: string, apiToken: string): Promise<boolean> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent?status=active`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  })
  const { sessions } = await response.json()
  if (sessions && sessions.length > 0) {
    const session = sessions[0]
    await whatsappService.sendMessage(
      phoneNumber,
      `⚠️ Tu as déjà une session en cours !\n\n⏱️ Temps écoulé : ${session.elapsedMinutes}/${session.plannedDuration} minutes\n\nÉcris "termine session" pour la terminer ou "pause session" pour faire une pause.`
    )
    return true
  }

  await whatsappService.sendMessage(
    phoneNumber,
    `🚀 *C'est parti pour une session Deep Work !*\n\nCombien de temps veux-tu travailler ?\n\n💡 Choix rapides :\n• 25 (Pomodoro)\n• 50 (Session courte)\n• 90 (Deep Work classique)\n• 120 (Session intensive)\n\nOu réponds avec n'importe quel nombre de minutes !`
  )
  userStates.set(userId, { state: 'awaiting_deepwork_duration' })
  return true
}

async function processDurationResponse(message: string, userId: string, phoneNumber: string, apiToken: string): Promise<boolean> {
  const match = message.match(/(\d+)/)
  if (!match) {
    await whatsappService.sendMessage(phoneNumber, `🤔 Je n'ai pas compris... Réponds simplement avec un nombre de minutes !\n\nExemples : 25, 90, 120`)
    return true
  }
  const duration = parseInt(match[1])
  if (duration < 5) {
    await whatsappService.sendMessage(phoneNumber, `⚠️ Minimum 5 minutes pour une session Deep Work !\n\nRéessaye avec une durée plus longue.`)
    return true
  }
  if (duration > 240) {
    await whatsappService.sendMessage(phoneNumber, `⚠️ Maximum 240 minutes (4h) !\n\nAu-delà, tu risques de perdre en concentration. Réessaye avec une durée plus courte.`)
    return true
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plannedDuration: duration, type: 'deepwork' })
    })
    if (response.ok) {
      const { endTimeExpected } = await response.json()
      const endTime = new Date(endTimeExpected)
      await whatsappService.sendMessage(phoneNumber, `✅ *Session Deep Work lancée !*\n\n⏱️ Durée : ${duration} minutes\n🎯 Fin prévue : ${endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n🔥 Reste concentré, tu peux le faire ! 💪\n\n_Je te préviendrai 5 minutes avant la fin._`)
      userStates.delete(userId)
    } else {
      const error = await response.json()
      await whatsappService.sendMessage(phoneNumber, `❌ Oups, impossible de lancer la session :\n${error.error || 'Erreur inconnue'}`)
      userStates.delete(userId)
    }
  } catch (error) {
    console.error('Erreur création session Deep Work:', error)
    await whatsappService.sendMessage(phoneNumber, `❌ Erreur technique. Réessaye dans quelques instants !`)
    userStates.delete(userId)
  }
  return true
}

async function endDeepWorkSession(userId: string, phoneNumber: string, apiToken: string): Promise<boolean> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent?status=active`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  })
  const { sessions } = await response.json()
  if (!sessions || sessions.length === 0) {
    await whatsappService.sendMessage(phoneNumber, `ℹ️ Aucune session en cours.\n\nÉcris "je commence à travailler" pour démarrer une nouvelle session !`)
    return true
  }
  const session = sessions[0]
  const endResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent/${session.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'complete' })
  })
  if (endResponse.ok) {
    const { actualDuration } = await endResponse.json()
    const wasOnTime = actualDuration <= session.plannedDuration + 2
    let message = `✅ *Session terminée !*\n\n`
    message += `⏱️ Durée prévue : ${session.plannedDuration} min\n`
    message += `⏱️ Durée réelle : ${actualDuration} min\n\n`
    if (wasOnTime) {
      message += `🎉 Parfait ! Tu as tenu ton objectif !\n\n`
    } else {
      const diff = actualDuration - session.plannedDuration
      message += `Tu as ${diff > 0 ? 'dépassé de' : 'terminé'} ${Math.abs(diff)} minutes ${diff > 0 ? 'plus tard' : 'plus tôt'}.\n\n`
    }
    message += `💪 Bien joué ! Profite d'une pause bien méritée !`
    await whatsappService.sendMessage(phoneNumber, message)
  } else {
    await whatsappService.sendMessage(phoneNumber, `❌ Erreur lors de la terminaison de la session.`)
  }
  return true
}

async function getActiveSession(userId: string, phoneNumber: string, apiToken: string): Promise<boolean> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent?status=active`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  })
  const { sessions } = await response.json()
  if (!sessions || sessions.length === 0) {
    await whatsappService.sendMessage(phoneNumber, `ℹ️ Aucune session en cours.\n\nÉcris "je commence à travailler" pour démarrer une nouvelle session !`)
    return true
  }
  const session = sessions[0]
  const remainingMinutes = session.plannedDuration - session.elapsedMinutes
  const progressPercent = Math.round((session.elapsedMinutes / session.plannedDuration) * 100)
  let message = `⏱️ *Session Deep Work en cours*\n\n`
  message += `🎯 Type : ${session.type}\n`
  message += `⏳ Temps écoulé : ${session.elapsedMinutes} min\n`
  message += `⏱️ Temps restant : ${remainingMinutes} min\n`
  message += `📊 Progression : ${progressPercent}%\n\n`
  message += remainingMinutes > 0 ? `💪 Continue, tu es sur la bonne voie !` : `⚠️ Le temps est écoulé ! La session va se terminer automatiquement.`
  await whatsappService.sendMessage(phoneNumber, message)
  return true
}

async function pauseSession(userId: string, phoneNumber: string, apiToken: string): Promise<boolean> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent?status=active`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  })
  const { sessions } = await response.json()
  if (!sessions || sessions.length === 0) {
    await whatsappService.sendMessage(phoneNumber, `ℹ️ Aucune session active à mettre en pause.`)
    return true
  }
  const session = sessions[0]
  const pauseResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent/${session.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pause' })
  })
  if (pauseResponse.ok) {
    await whatsappService.sendMessage(phoneNumber, `⏸️ *Session mise en pause*\n\n⏱️ Temps écoulé : ${session.elapsedMinutes} min\n\nÉcris "reprendre session" quand tu es prêt(e) à continuer !`)
  } else {
    await whatsappService.sendMessage(phoneNumber, `❌ Impossible de mettre en pause la session.`)
  }
  return true
}

async function resumeSession(userId: string, phoneNumber: string, apiToken: string): Promise<boolean> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent?status=paused`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  })
  const { sessions } = await response.json()
  if (!sessions || sessions.length === 0) {
    await whatsappService.sendMessage(phoneNumber, `ℹ️ Aucune session en pause.\n\nTu veux démarrer une nouvelle session ?`)
    return true
  }
  const session = sessions[0]
  const resumeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent/${session.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'resume' })
  })
  if (resumeResponse.ok) {
    const remainingMinutes = session.plannedDuration - session.elapsedMinutes
    await whatsappService.sendMessage(phoneNumber, `▶️ *Session reprise !*\n\n⏱️ Temps restant : ${remainingMinutes} min\n\n🔥 Allez, on y retourne ! 💪`)
  } else {
    await whatsappService.sendMessage(phoneNumber, `❌ Impossible de reprendre la session.`)
  }
  return true
}

async function showHistory(userId: string, phoneNumber: string, apiToken: string): Promise<boolean> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent?status=completed&limit=5`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  })
  const { sessions } = await response.json()
  if (!sessions || sessions.length === 0) {
    await whatsappService.sendMessage(phoneNumber, `📊 Aucune session terminée pour le moment.\n\nCommence ta première session Deep Work maintenant !`)
    return true
  }

  let message = `📊 *Tes 5 dernières sessions*\n\n`
  sessions.forEach((s: any) => {
    const date = new Date(s.timeEntry.startTime)
    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const actualDuration = s.timeEntry.endTime ? Math.floor((new Date(s.timeEntry.endTime).getTime() - date.getTime()) / 60000) : s.plannedDuration
    const wasOnTime = actualDuration <= s.plannedDuration + 2
    const emoji = wasOnTime ? '✅' : '⚠️'
    message += `${emoji} *${dateStr} à ${timeStr}*\n ${actualDuration}/${s.plannedDuration} min`
    if (s.interruptions > 0) message += ` • ${s.interruptions} interruption(s)`
    message += `\n\n`
  })

  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((sum: number, s: any) => {
    if (s.timeEntry.endTime) {
      return sum + Math.floor((new Date(s.timeEntry.endTime).getTime() - new Date(s.timeEntry.startTime).getTime()) / 60000)
    }
    return sum
  }, 0)
  const avgMinutes = Math.round(totalMinutes / totalSessions)
  message += `📈 *Stats :* ${totalMinutes} min totales • Moyenne ${avgMinutes} min/session`

  await whatsappService.sendMessage(phoneNumber, message)
  return true
}


