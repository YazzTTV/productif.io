/**
 * Types pour le système de scheduling Google Calendar
 */

// Option de créneau proposé à l'utilisateur
export interface SlotOption {
  start: Date
  end: Date
  label: string        // "demain 09:00", "aujourd'hui 16:00"
  isMorning: boolean
  score: number        // Score de priorité pour ce slot
}

// Événement Google Calendar
export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  extendedProperties?: {
    private?: {
      productif?: string
      taskId?: string
      version?: string
    }
  }
  colorId?: string
}

// Période occupée dans le calendrier
export interface BusyPeriod {
  start: Date
  end: Date
}

// Paramètres utilisateur pour le scheduling
export interface UserSchedulingPreferences {
  startHour: number           // Heure de début de journée (ex: 8)
  endHour: number             // Heure de fin de journée (ex: 20)
  allowedDays: number[]       // Jours autorisés (1=lundi, 7=dimanche)
  timezone: string            // Fuseau horaire (ex: "Europe/Paris")
  morningEndHour: number      // Fin du matin (ex: 12)
  afternoonStartHour: number  // Début après-midi (ex: 14)
  breakMinutes: number        // Pause entre sessions (ex: 10)
}

// Résultat de la création d'un événement
export interface CreateEventResult {
  success: boolean
  eventId?: string
  error?: string
}

// Résultat de la recherche de créneaux
export interface FindSlotsResult {
  slots: SlotOption[]
  busyPeriods: BusyPeriod[]
  error?: string
}

// Statut de scheduling d'une tâche
export type SchedulingStatus = 'draft' | 'proposed' | 'scheduled' | 'done' | 'not_done' | 'snoozed'

// Réponse utilisateur après un événement
export type UserEventResponse = 'done' | 'not_done' | 'snoozed'

// Configuration par défaut
export const DEFAULT_SCHEDULING_PREFERENCES: UserSchedulingPreferences = {
  startHour: 8,
  endHour: 20,
  allowedDays: [1, 2, 3, 4, 5], // Lundi à Vendredi
  timezone: 'Europe/Paris',
  morningEndHour: 12,
  afternoonStartHour: 14,
  breakMinutes: 10
}

// Couleurs Google Calendar pour Productif
export const PRODUCTIF_CALENDAR_COLOR = '9' // Bleu clair

