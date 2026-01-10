/**
 * API pour récupérer les événements Google Calendar d'une date spécifique
 * GET /api/planning/calendar-events?date=YYYY-MM-DD
 * Utilisé par Plan My Day pour proposer des créneaux qui n'empiètent pas sur l'agenda existant
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Paramètre date requis (format: YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    // Parser la date
    const targetDate = new Date(dateParam + 'T12:00:00') // Midi pour éviter les problèmes de timezone
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Format de date invalide. Utilisez YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Vérifier la connexion Google Calendar
    const hasCalendar = await googleCalendarService.isConnected(user.id)
    if (!hasCalendar) {
      return NextResponse.json({
        events: [],
        connected: false,
        message: 'Google Calendar non connecté',
      })
    }

    // Récupérer les événements de la date
    const events = await googleCalendarService.getEventsForDate(user.id, targetDate)

    // Formater les événements pour le client (début, fin, titre)
    const formattedEvents = events.map((evt: any) => {
      const start = evt.start?.dateTime || evt.start?.date
      const end = evt.end?.dateTime || evt.end?.date
      return {
        id: evt.id,
        title: evt.summary || 'Sans titre',
        start: start,
        end: end,
        startDate: start ? new Date(start).toISOString() : null,
        endDate: end ? new Date(end).toISOString() : null,
      }
    })

    return NextResponse.json({
      events: formattedEvents,
      connected: true,
      date: dateParam,
    })
  } catch (error) {
    console.error('Erreur /api/planning/calendar-events:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
