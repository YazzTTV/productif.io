/**
 * API pour créer les événements Plan My Day dans Google Calendar ET les tâches dans la DB
 * POST /api/planning/daily-events
 * 
 * Chaque event peut contenir: title, description?, subjectName?, subjectId?, 
 * priority?, energy?, start, durationMinutes
 * 
 * - Crée les tâches dans la table Task (visibles dans AI Tasks)
 * - Crée les événements dans Google Calendar
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'
import { prisma } from '@/lib/prisma'

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

// Mapper energy (1-5 de Plan My Day) vers energyLevel (0-3 de l'API tasks)
function mapEnergyToLevel(energy: number | undefined): number {
  if (energy === undefined || energy === null) return 1 // Moyen par défaut
  if (energy <= 2) return 0 // Faible
  if (energy === 3) return 1 // Moyen
  if (energy === 4) return 2 // Élevé
  return 3 // Extrême (energy >= 5)
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

    // Valider le format des événements (avec champs optionnels pour créer les tâches)
    const validEvents = events.map((evt: any) => ({
      title: evt.title || 'Tâche',
      description: evt.description || null,
      subjectName: evt.subjectName || null,
      subjectId: evt.subjectId || null,
      priority: typeof evt.priority === 'number' ? evt.priority : 3,
      energy: typeof evt.energy === 'number' ? evt.energy : 3,
      start: new Date(evt.start),
      durationMinutes: parseInt(evt.durationMinutes) || 60,
    }))

    // Vérifier la connexion Google Calendar (requise pour créer les événements)
    const hasCalendar = await googleCalendarService.isConnected(user.id)
    if (!hasCalendar) {
      return NextResponse.json(
        { error: 'Google Calendar non connecté', connected: false },
        { status: 400 }
      )
    }

    const taskIds: string[] = []
    const calendarResults: Array<{ success: boolean; eventId?: string; error?: string }> = []

    // 1. Créer les TÂCHES dans la DB (visibles dans AI Tasks)
    for (const evt of validEvents) {
      try {
        const dueDate = new Date(evt.start) // La date/heure planifiée comme dueDate
        const energyLevel = mapEnergyToLevel(evt.energy)

        const task = await prisma.task.create({
          data: {
            title: evt.title,
            description: evt.description || '',
            priority: evt.priority,
            energyLevel,
            dueDate,
            subjectId: evt.subjectId || null,
            estimatedMinutes: evt.durationMinutes,
            completed: false,
            userId: user.id,
            order: 500, // Order par défaut pour les tâches Plan My Day
            schedulingStatus: 'scheduled', // Déjà planifiée
          },
        })
        taskIds.push(task.id)
      } catch (taskError: any) {
        console.error('Erreur création tâche Plan My Day:', taskError)
        // Continuer quand même - on créera l'événement calendar
      }
    }

    // 2. Créer les ÉVÉNEMENTS dans Google Calendar
    const calendarEventsForApi = validEvents.map((evt: any) => ({
      title: evt.title,
      subjectName: evt.subjectName || null,
      start: evt.start,
      durationMinutes: evt.durationMinutes,
    }))

    const results = await googleCalendarService.createPlanMyDayEvents(
      user.id,
      calendarEventsForApi
    )

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      eventsCreated: successCount,
      eventsFailed: failureCount,
      tasksCreated: taskIds.length,
      taskIds,
      results,
      message: `${successCount} événement(s) créé(s) dans Google Calendar, ${taskIds.length} tâche(s) ajoutée(s) à AI Tasks`,
    })
  } catch (error) {
    console.error('Erreur /api/planning/daily-events:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
