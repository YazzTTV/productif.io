/**
 * Service de recherche de créneaux disponibles
 * Algorithme de priorisation pour placer les tâches optimalement
 */

import { prisma } from '@/lib/prisma'
import { googleCalendarService } from './GoogleCalendarService'
import {
  SlotOption,
  BusyPeriod,
  UserSchedulingPreferences,
  DEFAULT_SCHEDULING_PREFERENCES,
  FindSlotsResult
} from './types'

/**
 * Calcule le score de priorité d'une tâche
 * Plus le score est élevé, plus la tâche devrait être placée tôt dans la journée
 */
export function calculatePriorityScore(
  priority: number,      // 0-4
  energyLevel: number,   // 0-3
  deadline?: Date
): number {
  // Score de base: priority * 2 + energyLevel
  let score = (priority || 2) * 2 + (energyLevel || 1)

  // Bonus d'urgence si deadline proche
  if (deadline) {
    const now = new Date()
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilDeadline <= 1) {
      score += 5 // Très urgent
    } else if (daysUntilDeadline <= 3) {
      score += 3 // Urgent
    } else if (daysUntilDeadline <= 7) {
      score += 1 // Important
    }
  }

  return score
}

/**
 * Récupère les préférences de scheduling de l'utilisateur
 */
async function getUserPreferences(userId: string): Promise<UserSchedulingPreferences> {
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId }
  })

  if (!settings) {
    return DEFAULT_SCHEDULING_PREFERENCES
  }

  return {
    startHour: settings.startHour || 8,
    endHour: settings.endHour || 20,
    allowedDays: settings.allowedDays || [1, 2, 3, 4, 5],
    timezone: settings.timezone || 'Europe/Paris',
    morningEndHour: 12,
    afternoonStartHour: 14,
    breakMinutes: 10
  }
}

/**
 * Vérifie si un créneau est disponible (pas de conflit avec les busy times)
 */
function isSlotAvailable(
  start: Date,
  end: Date,
  busyPeriods: BusyPeriod[]
): boolean {
  for (const busy of busyPeriods) {
    // Conflit si le créneau chevauche une période occupée
    if (start < busy.end && end > busy.start) {
      return false
    }
  }
  return true
}

/**
 * Vérifie si une date est dans les jours autorisés
 */
function isAllowedDay(date: Date, allowedDays: number[]): boolean {
  // getDay() retourne 0 pour dimanche, on convertit en 1-7 (lundi=1)
  let day = date.getDay()
  if (day === 0) day = 7 // Dimanche = 7
  return allowedDays.includes(day)
}

/**
 * Formate un créneau en label lisible
 */
function formatSlotLabel(date: Date): string {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const isToday = date.toDateString() === now.toDateString()
  const isTomorrow = date.toDateString() === tomorrow.toDateString()

  const timeStr = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  if (isToday) {
    return `Aujourd'hui ${timeStr}`
  } else if (isTomorrow) {
    return `Demain ${timeStr}`
  } else {
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
    const dayMonth = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    return `${dayName} ${dayMonth} ${timeStr}`
  }
}

/**
 * Trouve les meilleurs créneaux disponibles pour une tâche
 */
export async function findBestSlots(
  userId: string,
  estimatedMinutes: number,
  priority: number,
  energyLevel: number,
  deadline?: Date
): Promise<FindSlotsResult> {
  const prefs = await getUserPreferences(userId)
  const priorityScore = calculatePriorityScore(priority, energyLevel, deadline)
  
  // Fenêtre de recherche: 7 prochains jours
  const now = new Date()
  
  // Déterminer le jour de départ en fonction de la deadline
  let searchStart: Date
  let minDate: Date | null = null // Date minimum pour les créneaux (deadline si dans le futur)
  
  if (deadline) {
    // Normaliser la deadline à minuit pour la comparaison
    const deadlineDate = new Date(deadline)
    deadlineDate.setHours(0, 0, 0, 0)
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    
    // Si la deadline est aujourd'hui ou dans le passé, commencer aujourd'hui
    // Sinon, commencer à partir de la deadline
    if (deadlineDate <= today) {
      searchStart = now
      console.log(`📅 Deadline aujourd'hui ou passée, recherche à partir de maintenant: ${searchStart.toISOString()}`)
    } else {
      // Deadline dans le futur : commencer à partir de la deadline
      searchStart = new Date(deadlineDate)
      searchStart.setHours(0, 0, 0, 0)
      // S'assurer qu'on ne propose pas de créneaux avant la deadline
      minDate = new Date(deadlineDate)
      console.log(`📅 Deadline future (${deadlineDate.toISOString()}), recherche à partir de: ${searchStart.toISOString()}, minDate: ${minDate.toISOString()}`)
    }
  } else {
    searchStart = now
    console.log(`📅 Pas de deadline, recherche à partir de maintenant: ${searchStart.toISOString()}`)
  }
  
  const searchEnd = new Date(searchStart)
  searchEnd.setDate(searchEnd.getDate() + 7)

  // Récupérer les busy times
  const busyPeriods = await googleCalendarService.getBusyTimes(userId, searchStart, searchEnd)

  const slots: SlotOption[] = []
  const durationMs = (estimatedMinutes + prefs.breakMinutes) * 60 * 1000

  // Déterminer la période cible selon le score
  let targetPeriod: 'morning' | 'afternoon' | 'evening'
  if (priorityScore >= 6) {
    targetPeriod = 'morning' // Haute priorité = matin
  } else if (priorityScore >= 3) {
    targetPeriod = 'afternoon' // Moyenne = après-midi
  } else {
    targetPeriod = 'evening' // Basse = soir
  }

  // Calculer le nombre de jours entre searchStart et maintenant
  const startDay = new Date(searchStart)
  startDay.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const daysFromToday = Math.ceil((startDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Parcourir les 7 prochains jours à partir de searchStart
  for (let dayOffset = 0; dayOffset < 7 && slots.length < 5; dayOffset++) {
    const currentDay = new Date(today)
    currentDay.setDate(currentDay.getDate() + daysFromToday + dayOffset)
    currentDay.setHours(0, 0, 0, 0)

    // Vérifier si c'est un jour autorisé
    if (!isAllowedDay(currentDay, prefs.allowedDays)) {
      continue
    }

    // Définir les plages horaires selon la période cible
    let periods: { start: number, end: number, isMorning: boolean }[]

    if (targetPeriod === 'morning') {
      periods = [
        { start: prefs.startHour, end: prefs.morningEndHour, isMorning: true },
        { start: prefs.afternoonStartHour, end: prefs.endHour - 2, isMorning: false },
        { start: prefs.endHour - 2, end: prefs.endHour, isMorning: false }
      ]
    } else if (targetPeriod === 'afternoon') {
      periods = [
        { start: prefs.afternoonStartHour, end: prefs.endHour - 2, isMorning: false },
        { start: prefs.startHour, end: prefs.morningEndHour, isMorning: true },
        { start: prefs.endHour - 2, end: prefs.endHour, isMorning: false }
      ]
    } else {
      periods = [
        { start: prefs.endHour - 2, end: prefs.endHour, isMorning: false },
        { start: prefs.afternoonStartHour, end: prefs.endHour - 2, isMorning: false },
        { start: prefs.startHour, end: prefs.morningEndHour, isMorning: true }
      ]
    }

    for (const period of periods) {
      if (slots.length >= 5) break

      // Parcourir la période par intervalles de 30 min
      for (let hour = period.start; hour < period.end && slots.length < 5; hour += 0.5) {
        const slotStart = new Date(currentDay)
        slotStart.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0)

        // Ignorer les créneaux dans le passé ou avant la deadline
        if (slotStart < searchStart) continue
        
        // Si une date minimum est définie (deadline future), s'assurer que le créneau est après
        if (minDate) {
          const slotDay = new Date(slotStart)
          slotDay.setHours(0, 0, 0, 0)
          if (slotDay < minDate) continue
        }

        const slotEnd = new Date(slotStart.getTime() + durationMs)

        // Vérifier que le créneau ne dépasse pas la fin de journée
        const dayEnd = new Date(currentDay)
        dayEnd.setHours(prefs.endHour, 0, 0, 0)
        if (slotEnd > dayEnd) continue

        // Vérifier la disponibilité
        if (isSlotAvailable(slotStart, slotEnd, busyPeriods)) {
          // Éviter les doublons (même jour/heure)
          const isDuplicate = slots.some(s => 
            s.start.getTime() === slotStart.getTime()
          )

          if (!isDuplicate) {
            slots.push({
              start: slotStart,
              end: slotEnd,
              label: formatSlotLabel(slotStart),
              isMorning: period.isMorning,
              score: priorityScore
            })
          }
        }
      }
    }
  }

  // Trier par pertinence (matin d'abord pour haute priorité)
  slots.sort((a, b) => {
    if (a.isMorning && !b.isMorning && priorityScore >= 6) return -1
    if (!a.isMorning && b.isMorning && priorityScore >= 6) return 1
    return a.start.getTime() - b.start.getTime()
  })

  return {
    slots: slots.slice(0, 3), // Retourner max 3 options
    busyPeriods
  }
}

/**
 * Trouve un créneau de report (snooze)
 */
export async function findSnoozeSlot(
  userId: string,
  estimatedMinutes: number,
  snoozeMinutes: number = 30
): Promise<SlotOption | null> {
  const now = new Date()
  const snoozeStart = new Date(now.getTime() + snoozeMinutes * 60 * 1000)
  const snoozeEnd = new Date(snoozeStart.getTime() + estimatedMinutes * 60 * 1000)

  // Vérifier si le créneau est disponible
  const busyPeriods = await googleCalendarService.getBusyTimes(
    userId,
    snoozeStart,
    snoozeEnd
  )

  if (isSlotAvailable(snoozeStart, snoozeEnd, busyPeriods)) {
    return {
      start: snoozeStart,
      end: snoozeEnd,
      label: `Dans ${snoozeMinutes} min`,
      isMorning: snoozeStart.getHours() < 12,
      score: 0
    }
  }

  // Si pas disponible, chercher le prochain créneau
  const result = await findBestSlots(userId, estimatedMinutes, 2, 1)
  return result.slots[0] || null
}

