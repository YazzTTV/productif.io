/**
 * Handler pour les commandes liées au calendrier et à la planification
 */

import { prisma } from '@/lib/prisma'
import { googleCalendarService, findBestSlots } from '@/lib/calendar'

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

/**
 * Gère les confirmations de planification de créneau
 */
export async function handleScheduleConfirmation(
  message: string,
  userId: string
): Promise<{ handled: boolean; response: string }> {
  const currentState = await getUserConversationState(userId)
  
  if (!currentState) {
    return { handled: false, response: '' }
  }

  const lowerMessage = message.toLowerCase().trim()

  // === Confirmation de créneau proposé ===
  if (currentState.state === 'awaiting_schedule_confirmation') {
    const { taskId, slots } = currentState.data as { 
      taskId: string
      slots: Array<{ start: string; end: string; label: string }>
    }

    // Accepter le créneau
    if (lowerMessage === 'oui' || lowerMessage === 'ok' || lowerMessage === 'valide' || lowerMessage === 'yes') {
      const slot = slots[0]
      
      // Récupérer la tâche
      const task = await prisma.task.findUnique({ where: { id: taskId } })
      if (!task) {
        await clearUserConversationState(userId)
        return { handled: true, response: "❌ Tâche introuvable." }
      }

      // Créer l'événement Google Calendar
      const result = await googleCalendarService.createProductifEvent(
        userId,
        taskId,
        task.title,
        new Date(slot.start),
        new Date(slot.end),
        task.description || undefined
      )

      if (!result.success || !result.eventId) {
        await clearUserConversationState(userId)
        return { 
          handled: true, 
          response: "❌ Erreur lors de la création de l'événement. Réessaie plus tard." 
        }
      }

      // Mettre à jour la tâche
      await prisma.task.update({
        where: { id: taskId },
        data: {
          googleCalendarEventId: result.eventId,
          schedulingStatus: 'scheduled',
          scheduledFor: new Date(slot.start),
          proposedSlotStart: new Date(slot.start),
          proposedSlotEnd: new Date(slot.end)
        }
      })

      // Créer l'entrée ScheduledTaskEvent
      await prisma.scheduledTaskEvent.create({
        data: {
          taskId,
          userId,
          googleEventId: result.eventId,
          startTime: new Date(slot.start),
          endTime: new Date(slot.end)
        }
      })

      await clearUserConversationState(userId)

      return {
        handled: true,
        response: `✅ Parfait ! J'ai planifié "${task.title}" pour ${slot.label}.\n\n` +
          `📅 L'événement est dans ton Google Calendar !\n` +
          `⏰ Je te rappellerai 5 min avant.`
      }
    }

    // Demander d'autres options
    if (lowerMessage === 'autre' || lowerMessage === 'autres' || lowerMessage === 'changer') {
      if (slots.length <= 1) {
        return {
          handled: true,
          response: "🤔 Je n'ai pas d'autre créneau disponible pour le moment. Tu veux que je cherche un autre jour ?"
        }
      }

      // Proposer les autres créneaux
      let response = "📅 Voici d'autres créneaux :\n\n"
      slots.slice(0, 3).forEach((slot, idx) => {
        response += `${idx + 1}. ${slot.label}\n`
      })
      response += "\nRéponds avec le numéro de ton choix ou *Non* pour annuler."

      await setUserConversationState(userId, 'awaiting_slot_choice', {
        taskId,
        slots
      })

      return { handled: true, response }
    }

    // Refuser la planification
    if (lowerMessage === 'non' || lowerMessage === 'pas maintenant' || lowerMessage === 'annuler') {
      await clearUserConversationState(userId)
      return {
        handled: true,
        response: "👌 OK, la tâche reste dans ta liste sans planification. Tu pourras la planifier plus tard !"
      }
    }

    return { handled: false, response: '' }
  }

  // === Choix d'un créneau parmi plusieurs ===
  if (currentState.state === 'awaiting_slot_choice') {
    const { taskId, slots } = currentState.data as {
      taskId: string
      slots: Array<{ start: string; end: string; label: string }>
    }

    // Choix par numéro
    const choiceNum = parseInt(lowerMessage)
    if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= slots.length) {
      const slot = slots[choiceNum - 1]
      
      const task = await prisma.task.findUnique({ where: { id: taskId } })
      if (!task) {
        await clearUserConversationState(userId)
        return { handled: true, response: "❌ Tâche introuvable." }
      }

      // Créer l'événement
      const result = await googleCalendarService.createProductifEvent(
        userId,
        taskId,
        task.title,
        new Date(slot.start),
        new Date(slot.end),
        task.description || undefined
      )

      if (!result.success || !result.eventId) {
        await clearUserConversationState(userId)
        return { handled: true, response: "❌ Erreur lors de la création. Réessaie." }
      }

      await prisma.task.update({
        where: { id: taskId },
        data: {
          googleCalendarEventId: result.eventId,
          schedulingStatus: 'scheduled',
          scheduledFor: new Date(slot.start),
          proposedSlotStart: new Date(slot.start),
          proposedSlotEnd: new Date(slot.end)
        }
      })

      await prisma.scheduledTaskEvent.create({
        data: {
          taskId,
          userId,
          googleEventId: result.eventId,
          startTime: new Date(slot.start),
          endTime: new Date(slot.end)
        }
      })

      await clearUserConversationState(userId)

      return {
        handled: true,
        response: `✅ C'est noté ! "${task.title}" planifié pour ${slot.label}.\n\n📅 RDV dans ton Google Calendar !`
      }
    }

    if (lowerMessage === 'non' || lowerMessage === 'annuler') {
      await clearUserConversationState(userId)
      return { handled: true, response: "👌 Annulé. La tâche reste dans ta liste." }
    }

    return {
      handled: true,
      response: "🤔 Je n'ai pas compris. Réponds avec un numéro (1, 2, 3) ou *Non* pour annuler."
    }
  }

  // === Réponse fait/pas fait après un événement ===
  if (currentState.state === 'awaiting_task_completion') {
    const { eventId, taskId, taskTitle } = currentState.data as {
      eventId: string
      taskId: string
      taskTitle: string
    }

    // Tâche faite
    if (
      lowerMessage === 'oui' || 
      lowerMessage === 'fait' || 
      lowerMessage === 'fini' || 
      lowerMessage === 'terminé' ||
      lowerMessage === 'done' ||
      lowerMessage === 'yes'
    ) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          completed: true,
          schedulingStatus: 'done'
        }
      })

      await prisma.scheduledTaskEvent.update({
        where: { id: eventId },
        data: {
          userResponse: 'done',
          postCheckSentAt: new Date()
        }
      })

      await clearUserConversationState(userId)

      return {
        handled: true,
        response: `🎉 Bravo ! "${taskTitle}" est complétée ! +15 XP 🏆\n\nContinue comme ça, tu gères ! 💪`
      }
    }

    // Tâche pas faite
    if (
      lowerMessage === 'non' || 
      lowerMessage === 'pas fait' || 
      lowerMessage === 'pas fini' ||
      lowerMessage === 'no'
    ) {
      await prisma.task.update({
        where: { id: taskId },
        data: { schedulingStatus: 'not_done' }
      })

      await prisma.scheduledTaskEvent.update({
        where: { id: eventId },
        data: {
          userResponse: 'not_done',
          postCheckSentAt: new Date()
        }
      })

      // Chercher de nouveaux créneaux
      const task = await prisma.task.findUnique({ where: { id: taskId } })
      const slots = await findBestSlots(
        userId,
        task?.estimatedMinutes || 30,
        task?.priority || 2,
        task?.energyLevel || 1
      )

      if (slots.slots.length > 0) {
        await setUserConversationState(userId, 'awaiting_schedule_confirmation', {
          taskId,
          slots: slots.slots.map(s => ({
            start: s.start.toISOString(),
            end: s.end.toISOString(),
            label: s.label
          }))
        })

        return {
          handled: true,
          response: `📅 Pas de souci ! On replanifie "${taskTitle}" ?\n\n` +
            `Je te propose : ${slots.slots[0].label}\n\n` +
            `Réponds *Oui*, *Autre* ou *Non*.`
        }
      } else {
        await clearUserConversationState(userId)
        return {
          handled: true,
          response: `👌 OK, "${taskTitle}" reste dans ta liste. Tu pourras la replanifier plus tard.`
        }
      }
    }

    // Reporter (snooze)
    if (
      lowerMessage.includes('report') ||
      lowerMessage.includes('plus tard') ||
      lowerMessage.includes('+15') ||
      lowerMessage.includes('+30')
    ) {
      let snoozeMinutes = 30
      if (lowerMessage.includes('+15') || lowerMessage.includes('15 min')) {
        snoozeMinutes = 15
      } else if (lowerMessage.includes('+60') || lowerMessage.includes('1h')) {
        snoozeMinutes = 60
      }

      const event = await prisma.scheduledTaskEvent.findUnique({
        where: { id: eventId }
      })

      if (event) {
        const newStart = new Date(Date.now() + snoozeMinutes * 60 * 1000)
        const duration = event.endTime.getTime() - event.startTime.getTime()
        const newEnd = new Date(newStart.getTime() + duration)

        await googleCalendarService.updateEvent(
          userId,
          event.googleEventId,
          { start: newStart, end: newEnd }
        )

        await prisma.scheduledTaskEvent.update({
          where: { id: eventId },
          data: {
            startTime: newStart,
            endTime: newEnd,
            userResponse: 'snoozed',
            rescheduledCount: { increment: 1 },
            reminderSentAt: null,
            postCheckSentAt: null
          }
        })

        await prisma.task.update({
          where: { id: taskId },
          data: {
            schedulingStatus: 'snoozed',
            scheduledFor: newStart
          }
        })
      }

      await clearUserConversationState(userId)

      return {
        handled: true,
        response: `⏳ OK, je te rappelle dans ${snoozeMinutes} minutes pour "${taskTitle}" !`
      }
    }

    return {
      handled: true,
      response: `Tu as terminé "${taskTitle}" ?\n\n` +
        `Réponds :\n` +
        `✅ *Oui* / *Fait*\n` +
        `❌ *Non* / *Pas fait*\n` +
        `⏳ *+15*, *+30* pour reporter`
    }
  }

  return { handled: false, response: '' }
}

/**
 * Propose un créneau pour une tâche nouvellement créée
 */
export async function proposeSlotForTask(
  userId: string,
  taskId: string,
  taskTitle: string,
  estimatedMinutes: number = 30,
  priority: number = 2,
  energyLevel: number = 1,
  deadline?: Date
): Promise<{ success: boolean; message: string }> {
  
  // Vérifier si l'utilisateur a connecté Google Calendar
  const hasCalendar = await googleCalendarService.isConnected(userId)
  if (!hasCalendar) {
    return {
      success: false,
      message: `✅ Tâche "${taskTitle}" créée !\n\n` +
        `💡 Connecte ton Google Calendar dans les paramètres pour que je puisse te proposer des créneaux automatiquement.`
    }
  }

  // Chercher les meilleurs créneaux
  const result = await findBestSlots(
    userId,
    estimatedMinutes,
    priority,
    energyLevel,
    deadline
  )

  if (result.slots.length === 0) {
    return {
      success: false,
      message: `✅ Tâche "${taskTitle}" créée !\n\n` +
        `📅 Ton calendrier semble bien rempli, je n'ai pas trouvé de créneau libre cette semaine.`
    }
  }

  // Stocker l'état pour attendre la confirmation
  await setUserConversationState(userId, 'awaiting_schedule_confirmation', {
    taskId,
    slots: result.slots.map(s => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      label: s.label
    }))
  })

  const slot = result.slots[0]
  const durationStr = estimatedMinutes >= 60 
    ? `${Math.floor(estimatedMinutes / 60)}h${estimatedMinutes % 60 > 0 ? estimatedMinutes % 60 : ''}` 
    : `${estimatedMinutes} min`

  return {
    success: true,
    message: `✅ Tâche "${taskTitle}" créée !\n\n` +
      `📅 Je te propose ce créneau :\n` +
      `➡️ **${slot.label}** (${durationStr})\n\n` +
      `Réponds :\n` +
      `✅ *Oui* pour valider\n` +
      `🔄 *Autre* pour d'autres options\n` +
      `❌ *Non* pour ignorer`
  }
}

