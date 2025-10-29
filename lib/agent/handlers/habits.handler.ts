import prisma from '@/lib/prisma'
import { whatsappService } from '@/lib/whatsapp'

/**
 * Parse et extrait la date demandée par l'utilisateur
 */
function parseDate(text: string): Date {
  const lowerText = text.toLowerCase()
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  if (lowerText.includes('aujourd\'hui') || lowerText.includes('aujourd\'hui') || lowerText.includes('aujourd\'hui')) {
    return now
  }
  
  if (lowerText.includes('demain') || lowerText.includes('tomorrow')) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow
  }
  
  if (lowerText.includes('hier') || lowerText.includes('yesterday')) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday
  }
  
  // Chercher une date spécifique (dd/mm, dd/mm/yyyy, etc.)
  const datePattern = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/
  const match = text.match(datePattern)
  
  if (match) {
    const day = parseInt(match[1])
    const month = parseInt(match[2]) - 1
    const year = match[3] ? parseInt(match[3]) : now.getFullYear()
    
    return new Date(year, month, day)
  }
  
  // Par défaut, aujourd'hui
  return now
}

/**
 * Vérifie si une habitude doit être réalisée à une date donnée
 */
function shouldHabitBeDoneOnDate(habit: any, targetDate: Date): boolean {
  const dayOfWeek = targetDate.toLocaleDateString('fr-FR', { weekday: 'long' })
  const lowerDay = dayOfWeek.toLowerCase()
  
  // Convertir en format attendu (lundi, mardi, etc.)
  const daysMapping: Record<string, string> = {
    'lundi': 'monday',
    'mardi': 'tuesday', 
    'mercredi': 'wednesday',
    'jeudi': 'thursday',
    'vendredi': 'friday',
    'samedi': 'saturday',
    'dimanche': 'sunday'
  }
  
  const normalizedDay = daysMapping[lowerDay] || lowerDay
  
  if (habit.frequency === 'daily') {
    return true
  }
  
  if (habit.frequency === 'weekly') {
    return habit.daysOfWeek.includes(normalizedDay) || habit.daysOfWeek.includes(lowerDay)
  }
  
  return false
}

/**
 * Récupère les habitudes manquantes pour une date donnée
 */
async function getMissingHabits(userId: string, targetDate: Date) {
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)
  
  // Récupérer toutes les habitudes de l'utilisateur
  const habits = await prisma.habit.findMany({
    where: { userId },
    orderBy: { order: 'asc' }
  })
  
  // Récupérer les habitudes complétées pour cette date
  const completedEntries = await prisma.habitEntry.findMany({
    where: {
      habitId: { in: habits.map(h => h.id) },
      date: {
        gte: startOfDay,
        lte: endOfDay
      },
      completed: true
    },
    select: { habitId: true }
  })
  
  const completedHabitIds = new Set(completedEntries.map(e => e.habitId))
  
  // Filtrer les habitudes qui doivent être faites et qui ne l'ont pas été
  const missingHabits = habits.filter(habit => {
    const shouldBeDone = shouldHabitBeDoneOnDate(habit, targetDate)
    const isCompleted = completedHabitIds.has(habit.id)
    
    return shouldBeDone && !isCompleted
  })
  
  return missingHabits
}

/**
 * Envoie la liste des habitudes manquantes
 */
export async function handleMissingHabitsCommand(
  message: string,
  userId: string,
  phoneNumber: string,
  apiToken: string
): Promise<boolean> {
  const lowerMessage = message.toLowerCase()
  
  // Détecter les variations de la question
  const patterns = [
    /quels? habitudes? (il|ils|elle|elles) (me|m'|te|t'|nous|vous) (reste?|restent)/i,
    /quels? habitudes? (me|m'|te|t'|nous|vous) (reste?|restent)/i,
    /habitudes? manquante?s?/i,
    /quels? habitudes? (à|a|en) (fai?re?|realiser?)/i
  ]
  
  const isAboutHabits = patterns.some(pattern => pattern.test(lowerMessage))
  
  if (!isAboutHabits) {
    return false
  }
  
  try {
    // Extraire la date demandée
    const targetDate = parseDate(lowerMessage)
    
    // Récupérer les habitudes manquantes
    const missingHabits = await getMissingHabits(userId, targetDate)
    
    // Formater le message
    const dateStr = targetDate.toLocaleDateString('fr-FR', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    
    if (missingHabits.length === 0) {
      await whatsappService.sendMessage(
        phoneNumber,
        `✅ Toutes tes habitudes pour ${dateStr} sont complétées ! 🎉\n\nContinue comme ça ! 💪`
      )
      return true
    }
    
    let message = `📋 **Habitudes à faire ${dateStr}**\n\n`
    message += `⚠️ Tu as ${missingHabits.length} habitude(s) à compléter :\n\n`
    
    missingHabits.forEach((habit, idx) => {
      const emoji = habit.frequency === 'daily' ? '🔁' : habit.frequency === 'weekly' ? '📅' : '⭐'
      message += `${idx + 1}. ${emoji} ${habit.name}\n`
      
      if (habit.description) {
        message += `   ${habit.description}\n`
      }
    })
    
    message += `\n💪 Tu as encore le temps de les compléter aujourd'hui !`
    
    await whatsappService.sendMessage(phoneNumber, message)
    return true
    
  } catch (error) {
    console.error('Erreur récupération habitudes manquantes:', error)
    await whatsappService.sendMessage(
      phoneNumber,
      '❌ Oups, erreur de récupération. Réessaye plus tard !'
    )
    return true
  }
}

export default {
  handleMissingHabitsCommand
}

