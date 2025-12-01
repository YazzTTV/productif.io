import { whatsappService } from '@/lib/whatsapp'
import prisma from '@/lib/prisma'
import { FlexibleMatcher } from '@/lib/utils/FlexibleMatcher'

// Helpers pour l'état conversationnel
async function getUserConversationState(userId: string) {
  return await prisma.userConversationState.findUnique({
    where: { userId }
  }).catch(() => null)
}

async function setUserConversationState(userId: string, state: string, data?: any) {
  await prisma.userConversationState.upsert({
    where: { userId },
    create: {
      userId,
      state,
      data: data || {}
    },
    update: {
      state,
      data: data || {}
    }
  })
}

async function clearUserConversationState(userId: string) {
  await prisma.userConversationState.delete({
    where: { userId }
  }).catch(() => {})
}

export async function handleTaskPlanningCommand(
  message: string,
  userId: string,
  phoneNumber: string,
  apiToken: string
): Promise<boolean> {
  // Vérifier si l'utilisateur est en mode planification
  const currentState = await getUserConversationState(userId)

  if (currentState?.state === 'awaiting_tasks_list') {
    return await processTasksList(message, userId, phoneNumber, apiToken)
  }

  // Utiliser le système de matching flexible
  const planMatch = FlexibleMatcher.matchesCommand(message, 'plan_tomorrow')
  if (planMatch.matches && planMatch.confidence >= 0.7) {
    return await startTaskPlanning(userId, phoneNumber)
  }

  return false
}

async function startTaskPlanning(
  userId: string,
  phoneNumber: string
): Promise<boolean> {
  const message = `📋 *Planification intelligente*\n\n` +
    `Dis-moi tout ce que tu as à faire demain, dans l'ordre que tu veux !\n\n` +
    `💡 *Tu peux mentionner :*\n` +
    `• Les tâches importantes ou urgentes\n` +
    `• Si une tâche est longue ou rapide\n` +
    `• Si ça demande beaucoup de concentration\n` +
    `• Les deadlines\n\n` +
    `*Exemple :*\n` +
    `"J'ai une réunion importante avec le client à 10h, puis je dois finir le rapport marketing urgent avant 16h. ` +
    `Je dois aussi répondre aux emails, appeler le fournisseur et ranger mon bureau."`

  await whatsappService.sendMessage(phoneNumber, message)

  // Enregistrer l'état
  await setUserConversationState(userId, 'awaiting_tasks_list')

  return true
}

async function processTasksList(
  message: string,
  userId: string,
  phoneNumber: string,
  apiToken: string
): Promise<boolean> {
  try {
    // Message de traitement
    await whatsappService.sendMessage(
      phoneNumber,
      `🤖 *Analyse en cours...*\n\nJe réfléchis à la meilleure organisation pour ta journée. ⏳`
    )

    // Appeler l'API de création intelligente
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/tasks/agent/batch-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userInput: message
        })
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
      throw new Error(error.error || 'Erreur création tâches')
    }

    const result = await response.json()

    // Construire le message de réponse
    let responseMessage = `✅ *${result.tasksCreated} tâche${result.tasksCreated > 1 ? 's' : ''} créée${result.tasksCreated > 1 ? 's' : ''} !*\n\n`
    
    // Ajouter le résumé de l'IA
    if (result.analysis?.summary) {
      responseMessage += `💭 *Analyse :*\n${result.analysis.summary}\n\n`
    }

    // Ajouter le plan organisé
    if (result.analysis?.planSummary) {
      responseMessage += result.analysis.planSummary
    }

    // Temps total estimé
    if (result.analysis?.totalEstimatedTime) {
      const hours = Math.floor(result.analysis.totalEstimatedTime / 60)
      const minutes = result.analysis.totalEstimatedTime % 60
      responseMessage += `\n\n⏱️ *Temps total estimé :* ${hours}h${minutes > 0 ? minutes : ''}`
    }

    responseMessage += `\n\n💡 *Conseil :* Commence par les tâches 🔴 haute priorité le matin quand ton énergie est au max !`

    await whatsappService.sendMessage(phoneNumber, responseMessage)

    // Envoyer les détails de chaque tâche si demandé (si ≤ 5 tâches)
    if (result.tasksCreated <= 5 && result.tasks && result.tasks.length > 0) {
      let detailsMessage = `\n📝 *Détails des tâches :*\n\n`
      
      result.tasks.forEach((task: any, idx: number) => {
        const priorityEmoji = ['⚪', '🔵', '🟡', '🟠', '🔴'][task.priority] || '⚪'
        const time = task.dueDate ? new Date(task.dueDate).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : 'Non définie'
        
        detailsMessage += `${idx + 1}. ${priorityEmoji} *${task.title}*\n`
        detailsMessage += `   ⏰ ${time}`
        
        if (task.estimatedDuration) {
          detailsMessage += ` • ${task.estimatedDuration}min`
        }
        
        if (task.reasoning) {
          detailsMessage += `\n   💬 ${task.reasoning}`
        }
        
        detailsMessage += `\n\n`
      })

      await whatsappService.sendMessage(phoneNumber, detailsMessage)
    }

    // Nettoyer l'état
    await clearUserConversationState(userId)

    return true

  } catch (error) {
    console.error('Erreur traitement liste de tâches:', error)
    
    await whatsappService.sendMessage(
      phoneNumber,
      `❌ Oups, je n'ai pas pu analyser ta liste.\n\nPeux-tu réessayer en étant plus spécifique ? 🙏`
    )

    // Nettoyer l'état
    await clearUserConversationState(userId)

    return true
  }
}

