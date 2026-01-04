/**
 * Service pour interagir avec l'API Google Calendar
 * Gère la création, mise à jour et lecture des événements Productif
 */

import { prisma } from '@/lib/prisma'
import {
  GoogleCalendarEvent,
  BusyPeriod,
  CreateEventResult,
  PRODUCTIF_CALENDAR_COLOR
} from './types'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

export class GoogleCalendarService {
  /**
   * Rafraîchit le token d'accès si nécessaire
   */
  async refreshTokenIfNeeded(userId: string): Promise<string | null> {
    const tokenRecord = await prisma.googleCalendarToken.findUnique({
      where: { userId }
    })

    if (!tokenRecord) {
      console.log(`❌ Pas de token Google Calendar pour l'utilisateur ${userId}`)
      return null
    }

    // Vérifier si le token expire dans les 5 prochaines minutes
    const now = new Date()
    const expiresAt = new Date(tokenRecord.expiresAt)
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    if (expiresAt > fiveMinutesFromNow) {
      // Token encore valide
      return tokenRecord.accessToken
    }

    // Token expiré ou bientôt expiré, le rafraîchir
    if (!tokenRecord.refreshToken) {
      console.log(`❌ Pas de refresh token pour l'utilisateur ${userId}`)
      return null
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: tokenRecord.refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error('Erreur refresh token:', error)
        return null
      }

      const data = await response.json()
      const newExpiresAt = new Date()
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + (data.expires_in || 3600))

      // Mettre à jour le token en base
      await prisma.googleCalendarToken.update({
        where: { userId },
        data: {
          accessToken: data.access_token,
          expiresAt: newExpiresAt,
          // Google ne renvoie pas toujours un nouveau refresh_token
          ...(data.refresh_token && { refreshToken: data.refresh_token })
        }
      })

      console.log(`✅ Token Google Calendar rafraîchi pour ${userId}`)
      return data.access_token
    } catch (error) {
      console.error('Erreur lors du refresh du token:', error)
      return null
    }
  }

  /**
   * Récupère les périodes occupées dans le calendrier
   */
  async getBusyTimes(
    userId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<BusyPeriod[]> {
    const accessToken = await this.refreshTokenIfNeeded(userId)
    if (!accessToken) {
      return []
    }

    try {
      const response = await fetch(`${CALENDAR_API_BASE}/freeBusy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: 'primary' }]
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error('Erreur freeBusy:', error)
        return []
      }

      const data = await response.json()
      const busy = data.calendars?.primary?.busy || []

      return busy.map((period: { start: string, end: string }) => ({
        start: new Date(period.start),
        end: new Date(period.end)
      }))
    } catch (error) {
      console.error('Erreur getBusyTimes:', error)
      return []
    }
  }

  /**
   * Crée un événement Productif dans Google Calendar
   */
  async createProductifEvent(
    userId: string,
    taskId: string,
    title: string,
    start: Date,
    end: Date,
    description?: string
  ): Promise<CreateEventResult> {
    const accessToken = await this.refreshTokenIfNeeded(userId)
    if (!accessToken) {
      return { success: false, error: 'Token non disponible' }
    }

    const event = {
      summary: `[Productif] ${title}`,
      description: description || `📋 Tâche Productif.io\n\nID: ${taskId}\n\nMarque cette tâche comme faite après !`,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'Europe/Paris'
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'Europe/Paris'
      },
      reminders: {
        useDefault: false,
        overrides: [] // On gère les rappels nous-mêmes via le scheduler
      },
      extendedProperties: {
        private: {
          productif: 'true',
          taskId: taskId,
          version: '1'
        }
      },
      colorId: PRODUCTIF_CALENDAR_COLOR
    }

    try {
      const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error('Erreur création événement:', error)
        return { success: false, error: error.error?.message || 'Erreur création événement' }
      }

      const createdEvent = await response.json()
      console.log(`✅ Événement créé: ${createdEvent.id} pour tâche ${taskId}`)

      return { success: true, eventId: createdEvent.id }
    } catch (error) {
      console.error('Erreur createProductifEvent:', error)
      return { success: false, error: 'Erreur réseau' }
    }
  }

  /**
   * Met à jour un événement (replanification)
   */
  async updateEvent(
    userId: string,
    eventId: string,
    updates: { start?: Date, end?: Date, description?: string }
  ): Promise<boolean> {
    const accessToken = await this.refreshTokenIfNeeded(userId)
    if (!accessToken) {
      return false
    }

    const patchData: any = {}
    
    if (updates.start) {
      patchData.start = {
        dateTime: updates.start.toISOString(),
        timeZone: 'Europe/Paris'
      }
    }
    
    if (updates.end) {
      patchData.end = {
        dateTime: updates.end.toISOString(),
        timeZone: 'Europe/Paris'
      }
    }
    
    if (updates.description) {
      patchData.description = updates.description
    }

    try {
      const response = await fetch(
        `${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(patchData)
        }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error('Erreur mise à jour événement:', error)
        return false
      }

      console.log(`✅ Événement ${eventId} mis à jour`)
      return true
    } catch (error) {
      console.error('Erreur updateEvent:', error)
      return false
    }
  }

  /**
   * Supprime un événement
   */
  async deleteEvent(userId: string, eventId: string): Promise<boolean> {
    const accessToken = await this.refreshTokenIfNeeded(userId)
    if (!accessToken) {
      return false
    }

    try {
      const response = await fetch(
        `${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok && response.status !== 410) { // 410 = déjà supprimé
        console.error('Erreur suppression événement:', response.status)
        return false
      }

      console.log(`✅ Événement ${eventId} supprimé`)
      return true
    } catch (error) {
      console.error('Erreur deleteEvent:', error)
      return false
    }
  }

  /**
   * Récupère les événements Productif à venir
   */
  async getUpcomingProductifEvents(
    userId: string,
    windowMinutes: number = 60
  ): Promise<GoogleCalendarEvent[]> {
    const accessToken = await this.refreshTokenIfNeeded(userId)
    if (!accessToken) {
      return []
    }

    const now = new Date()
    const maxTime = new Date(now.getTime() + windowMinutes * 60 * 1000)

    try {
      const params = new URLSearchParams({
        timeMin: now.toISOString(),
        timeMax: maxTime.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        privateExtendedProperty: 'productif=true'
      })

      const response = await fetch(
        `${CALENDAR_API_BASE}/calendars/primary/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        console.error('Erreur récupération événements:', response.status)
        return []
      }

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('Erreur getUpcomingProductifEvents:', error)
      return []
    }
  }

  /**
   * Vérifie si l'utilisateur a connecté Google Calendar
   */
  async isConnected(userId: string): Promise<boolean> {
    const token = await prisma.googleCalendarToken.findUnique({
      where: { userId }
    })
    return !!token
  }
}

// Instance singleton
export const googleCalendarService = new GoogleCalendarService()

