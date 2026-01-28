import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Fonction pour obtenir l'utilisateur depuis les cookies
async function getAuthUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return null
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string }
    return decoded
  } catch (error) {
    return null
  }
}

// GET : récupérer la config de check-in
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    let schedule = await prisma.checkInSchedule.findUnique({
      where: { userId: user.userId }
    })

    // Créer config par défaut si n'existe pas
    if (!schedule) {
      schedule = await prisma.checkInSchedule.create({
        data: {
          userId: user.userId,
          enabled: false, // Par défaut désactivé, l'utilisateur doit l'activer
          frequency: '3x_daily',
          schedules: [
            { time: '09:00', types: ['mood', 'energy'] },
            { time: '14:00', types: ['focus', 'motivation'] },
            { time: '18:00', types: ['stress', 'energy'] }
          ],
          randomize: true,
          skipWeekends: false
        }
      })
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Erreur GET check-in schedule:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH : mettre à jour la config
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const updates = await req.json()
    
    // Récupérer le schedule actuel pour vérifier si enabled change
    const currentSchedule = await prisma.checkInSchedule.findUnique({
      where: { userId: user.userId }
    })

    const schedule = await prisma.checkInSchedule.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        enabled: updates.enabled ?? false,
        frequency: updates.frequency ?? '3x_daily',
        schedules: updates.schedules ?? [
          { time: '09:00', types: ['mood', 'energy'] },
          { time: '14:00', types: ['focus', 'motivation'] },
          { time: '18:00', types: ['stress', 'energy'] }
        ],
        randomize: updates.randomize ?? true,
        skipWeekends: updates.skipWeekends ?? false
      },
      update: updates
    })

    // Si l'état enabled a changé, notifier le scheduler
    if (currentSchedule && currentSchedule.enabled !== schedule.enabled) {
      try {
        // Notifier le scheduler pour qu'il recharge les schedules
        // On utilise l'endpoint update-user qui déclenchera une mise à jour
        const schedulerUrl = process.env.SCHEDULER_URL || 'http://localhost:3001'
        await fetch(`${schedulerUrl}/api/update-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.userId,
            oldPreferences: null,
            newPreferences: { checkInEnabled: schedule.enabled },
            timestamp: new Date()
          })
        }).catch(err => {
          console.log('⚠️ Impossible de notifier le scheduler:', err.message)
          // On continue même si le scheduler n'est pas accessible
        })
        
        // Aussi appeler directement reloadAllSchedules si disponible
        // (pour un rechargement immédiat)
        try {
          await fetch(`${schedulerUrl}/api/reload-checkin-schedules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId })
          }).catch(() => {
            // Ignorer si l'endpoint n'existe pas encore
          })
        } catch (e) {
          // Ignorer
        }
      } catch (error) {
        console.log('⚠️ Erreur notification scheduler:', error)
      }
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Erreur PATCH check-in schedule:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

