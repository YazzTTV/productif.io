import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiAuth } from '@/middleware/api-auth'
import { startOfDay, endOfDay } from 'date-fns'

// Liste toutes les habitudes pour un agent IA
export async function GET(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['habits:read']
  })
  
  // Si l'authentification a échoué, retourner la réponse d'erreur
  if (authResponse) {
    return authResponse
  }
  
  // Extraire l'ID de l'utilisateur à partir de l'en-tête (ajouté par le middleware)
  const userId = req.headers.get('x-api-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }
  
  try {
    // Obtenir la date du jour avec début et fin de journée
    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)
    
    // Obtenir le jour en anglais pour le filtrage
    const currentDayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
    
    // Récupérer toutes les habitudes de l'utilisateur pour ce jour
    const habits = await prisma.habit.findMany({
      where: { 
        userId,
        // Filtrer uniquement les habitudes pour ce jour de la semaine
        daysOfWeek: {
          has: currentDayOfWeek
        }
      },
      include: {
        entries: {
          where: {
            // Filtrer les entrées pour la date d'aujourd'hui avec une plage
            date: {
              gte: startOfToday,
              lte: endOfToday
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    })
    
    return NextResponse.json(habits)
  } catch (error) {
    console.error('Erreur lors de la récupération des habitudes:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des habitudes' },
      { status: 500 }
    )
  }
}

// Marquer une habitude comme complétée via un agent IA
export async function POST(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['habits:write']
  })
  
  // Si l'authentification a échoué, retourner la réponse d'erreur
  if (authResponse) {
    return authResponse
  }
  
  // Extraire l'ID de l'utilisateur à partir de l'en-tête (ajouté par le middleware)
  const userId = req.headers.get('x-api-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }
  
  try {
    const { habitId, date, completed, note, rating } = await req.json()
    
    // Validation
    if (!habitId) {
      return NextResponse.json({ error: 'ID d\'habitude requis' }, { status: 400 })
    }
    
    if (!date) {
      return NextResponse.json({ error: 'Date requise' }, { status: 400 })
    }
    
    // Vérifier que l'habitude appartient à l'utilisateur
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId }
    })
    
    if (!habit) {
      return NextResponse.json({ error: 'Habitude non trouvée' }, { status: 404 })
    }
    
    // Convertir la date en objet Date
    const entryDate = new Date(date)
    
    // Créer ou mettre à jour l'entrée d'habitude
    const entry = await prisma.habitEntry.upsert({
      where: {
        habitId_date: {
          habitId,
          date: entryDate
        }
      },
      update: {
        completed: completed !== undefined ? completed : true,
        note,
        rating: rating || undefined
      },
      create: {
        habitId,
        date: entryDate,
        completed: completed !== undefined ? completed : true,
        note,
        rating: rating || undefined
      }
    })
    
    return NextResponse.json(entry)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'habitude:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'habitude' },
      { status: 500 }
    )
  }
} 