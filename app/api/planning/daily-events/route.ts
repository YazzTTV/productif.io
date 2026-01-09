/**
 * API pour créer les événements Plan My Day dans Google Calendar
 * POST /api/planning/daily-events
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'

// Configuration pour Vercel/Next.js
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// GET: Vérifier que la route est accessible (pour debug)
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Plan My Day daily-events API is available',
    supportedMethods: ['POST']
  })
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { events } = await req.json()

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'events array is required' },
        { status: 400 }
      )
    }

    // Valider le format des événements
    const validEvents = events.map((evt: any) => ({
      title: evt.title || 'Tâche',
      subjectName: evt.subjectName || null,
      start: new Date(evt.start),
      durationMinutes: parseInt(evt.durationMinutes) || 60,
    }))

    // Vérifier la connexion Google Calendar
    const hasCalendar = await googleCalendarService.isConnected(user.id)
    if (!hasCalendar) {
      return NextResponse.json(
        { error: 'Google Calendar non connecté', connected: false },
        { status: 400 }
      )
    }

    // Créer les événements
    const results = await googleCalendarService.createPlanMyDayEvents(
      user.id,
      validEvents
    )

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      eventsCreated: successCount,
      eventsFailed: failureCount,
      results,
      message: `${successCount} événement(s) créé(s) dans Google Calendar`,
    })
  } catch (error) {
    console.error('Erreur /api/planning/daily-events:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
