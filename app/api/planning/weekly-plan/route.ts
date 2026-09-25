/**
 * API pour générer et appliquer une planification hebdomadaire intelligente
 * POST /api/planning/weekly-plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { weeklyPlanningEngine } from '@/lib/planning/WeeklyPlanningEngine'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'
import { prisma } from '@/lib/prisma'

// Augmenter le timeout pour la planification (peut prendre du temps)
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que Google Calendar est connecté
    const hasCalendar = await googleCalendarService.isConnected(user.id)
    if (!hasCalendar) {
      return NextResponse.json(
        { error: 'Google Calendar non connecté. Connectez votre calendrier pour utiliser la planification automatique.' },
        { status: 400 }
      )
    }

    const { weekStart, apply = false } = await req.json()
    
    console.log('📅 [API] POST /planning/weekly-plan - weekStart reçu:', weekStart)
    const now = new Date()
    console.log('📅 [API] POST /planning/weekly-plan - now serveur:', now.toISOString(), 'Local:', now.toString())

    // Générer le plan
    const planStartDate = weekStart ? new Date(weekStart) : undefined
    if (planStartDate) {
      console.log('📅 [API] POST /planning/weekly-plan - planStartDate:', planStartDate.toISOString(), 'Local:', planStartDate.toString())
    }
    
    const plan = await weeklyPlanningEngine.planWeek(
      user.id,
      planStartDate
    )
    
    console.log('📅 [API] POST /planning/weekly-plan - Plan généré:', {
      sessionsCount: plan.sessions.length,
      firstSession: plan.sessions[0] ? {
        start: plan.sessions[0].start.toISOString(),
        end: plan.sessions[0].end.toISOString(),
        subject: plan.sessions[0].subjectName
      } : null
    })

    // Si apply = true, créer les événements dans Google Calendar
    if (apply && plan.sessions.length > 0) {
      // Récupérer les titres des tâches pour les descriptions
      const taskIds = new Set<string>()
      plan.sessions.forEach((s) => {
        s.tasks.forEach((taskId) => taskIds.add(taskId))
      })

      const tasks = await prisma.task.findMany({
        where: {
          id: { in: Array.from(taskIds) },
          userId: user.id,
        },
        select: {
          id: true,
          title: true,
        },
      })

      const taskMap = new Map(tasks.map((t) => [t.id, t.title]))

      // Préparer les sessions avec les titres des tâches
      const sessionsWithTitles = plan.sessions.map((session) => ({
        subjectName: session.subjectName,
        tasks: session.tasks,
        start: session.start,
        end: session.end,
        taskTitles: session.tasks
          .map((taskId) => taskMap.get(taskId))
          .filter((title): title is string => !!title),
      }))

      // Créer les événements en batch
      const results = await googleCalendarService.createBatchEvents(
        user.id,
        sessionsWithTitles
      )

      // Compter les succès et échecs
      const successCount = results.filter((r) => r.success).length
      const failureCount = results.filter((r) => !r.success).length

      // Mettre à jour les tâches avec les IDs des événements créés
      for (let i = 0; i < plan.sessions.length; i++) {
        const session = plan.sessions[i]
        const result = results[i]

        if (result.success && result.eventId) {
          // Mettre à jour chaque tâche de la session
          await prisma.task.updateMany({
            where: {
              id: { in: session.tasks },
              userId: user.id,
            },
            data: {
              schedulingStatus: 'scheduled',
              scheduledFor: session.start,
              proposedSlotStart: session.start,
              proposedSlotEnd: session.end,
              // Sans cet identifiant, le rattrapage (/api/planning/catch-up) ne
              // savait pas que le bloc avait un evenement et ne le deplacait jamais.
              googleCalendarEventId: result.eventId,
              // Applique par l'utilisateur : creneau fixe pour le planificateur automatique.
              autoPlannedAt: null,
            },
          })

          // Créer les ScheduledTaskEvent pour le tracking
          for (const taskId of session.tasks) {
            try {
              await prisma.scheduledTaskEvent.create({
                data: {
                  taskId,
                  userId: user.id,
                  googleEventId: result.eventId,
                  startTime: session.start,
                  endTime: session.end,
                },
              })
            } catch (createError: any) {
              // Ignorer les erreurs de duplication (googleEventId unique)
              if (createError.code !== 'P2002') {
                console.error('Erreur création ScheduledTaskEvent:', createError)
              }
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        plan,
        applied: true,
        eventsCreated: successCount,
        eventsFailed: failureCount,
        message: `${successCount} session(s) créée(s) dans Google Calendar${failureCount > 0 ? ` (${failureCount} échec(s))` : ''}`,
      })
    }

    // Retourner seulement le plan (preview)
    return NextResponse.json({
      success: true,
      plan,
      applied: false,
      message: 'Plan généré avec succès. Utilisez apply=true pour créer les événements.',
    })

  } catch (error: any) {
    console.error('Erreur POST /api/planning/weekly-plan:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET - Récupérer le plan de la semaine actuelle (sans l'appliquer)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const weekStart = searchParams.get('weekStart')

    // Générer le plan (preview seulement)
    const plan = await weeklyPlanningEngine.planWeek(
      user.id,
      weekStart ? new Date(weekStart) : undefined
    )

    return NextResponse.json({
      success: true,
      plan,
    })

  } catch (error: any) {
    console.error('Erreur GET /api/planning/weekly-plan:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

