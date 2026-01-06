/**
 * API pour récupérer les événements Google Calendar de l'utilisateur
 * GET /api/google-calendar/events
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur a connecté Google Calendar
    const hasCalendar = await googleCalendarService.isConnected(user.id)
    if (!hasCalendar) {
      return NextResponse.json(
        { error: 'Google Calendar non connecté', events: [] },
        { status: 200 } // On retourne 200 avec un tableau vide plutôt qu'une erreur
      )
    }

    // Récupérer les événements du jour
    const events = await googleCalendarService.getTodayEvents(user.id)

    // Formater les événements pour l'app mobile
    const formattedEvents = events.map((event) => {
      // Gérer les événements all-day (qui ont 'date' au lieu de 'dateTime')
      const isAllDay = !event.start?.dateTime && event.start?.date;
      const startValue = event.start?.dateTime || event.start?.date;
      const endValue = event.end?.dateTime || event.end?.date;
      
      return {
        id: event.id,
        summary: event.summary || 'Sans titre',
        description: event.description || '',
        start: startValue || '',
        end: endValue || '',
        timeZone: event.start?.timeZone || 'Europe/Paris',
        isAllDay,
        isProductif: event.extendedProperties?.private?.productif === 'true'
      };
    })

    return NextResponse.json({ 
      events: formattedEvents,
      connected: true
    })
  } catch (error) {
    console.error('Erreur GET /api/google-calendar/events:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', events: [] },
      { status: 500 }
    )
  }
}

