/**
 * API pour trouver des créneaux disponibles
 * POST /api/calendar/slots
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { findBestSlots, calculatePriorityScore } from '@/lib/calendar/SlotFinder'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { estimatedMinutes, priority, energyLevel, deadline } = await req.json()

    // Vérifier que l'utilisateur a connecté Google Calendar
    const hasCalendar = await googleCalendarService.isConnected(user.id)
    if (!hasCalendar) {
      return NextResponse.json(
        { error: 'Google Calendar non connecté', connected: false },
        { status: 400 }
      )
    }

    const result = await findBestSlots(
      user.id,
      estimatedMinutes || 30,
      priority || 2,
      energyLevel || 1,
      deadline ? new Date(deadline) : undefined
    )

    const priorityScore = calculatePriorityScore(
      priority || 2,
      energyLevel || 1,
      deadline ? new Date(deadline) : undefined
    )

    return NextResponse.json({
      success: true,
      slots: result.slots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        label: slot.label,
        isMorning: slot.isMorning
      })),
      priorityScore,
      recommendation: priorityScore >= 6 
        ? 'Haute priorité → créneau matin recommandé' 
        : priorityScore >= 3 
          ? 'Priorité moyenne → après-midi idéal'
          : 'Priorité basse → soir ou quand tu veux'
    })
  } catch (error) {
    console.error('Erreur /api/calendar/slots:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

