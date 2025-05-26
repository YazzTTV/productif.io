import { NextRequest, NextResponse } from "next/server"
import { apiAuth } from "@/middleware/api-auth"
import { prisma } from "@/lib/prisma"
import { format, subDays } from "date-fns"

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
    // Date d'aujourd'hui et date d'il y a 30 jours
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
    const thirtyDaysAgo = subDays(today, 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)
    
    // Récupérer toutes les habitudes de l'utilisateur
    const habits = await prisma.habit.findMany({
      where: {
        userId: userId
      },
      include: {
        entries: {
          where: {
            date: {
              gte: thirtyDaysAgo,
              lte: today
            }
          }
        }
      }
    })
    
    // Préparer les données pour chaque jour
    const historyData: Record<string, {
      date: string
      count: number
      percentage: number
      habits: {
        name: string
        completed: boolean
      }[]
    }> = {}
    
    // Initialiser tous les jours avec 0 habitudes
    for (let i = 0; i <= 30; i++) {
      const date = subDays(today, i)
      const dateKey = format(date, 'yyyy-MM-dd')
      historyData[dateKey] = {
        date: dateKey,
        count: 0,
        percentage: 0,
        habits: []
      }
    }
    
    // Remplir les données avec les habitudes complétées
    habits.forEach(habit => {
      habit.entries.forEach(entry => {
        const dateKey = format(entry.date, 'yyyy-MM-dd')
        if (historyData[dateKey]) {
          historyData[dateKey].habits.push({
            name: habit.name,
            completed: entry.completed
          })
          if (entry.completed) {
            historyData[dateKey].count++
          }
        }
      })
    })
    
    // Calculer les pourcentages
    Object.values(historyData).forEach(day => {
      const totalHabits = day.habits.length
      if (totalHabits > 0) {
        day.percentage = Math.round((day.count / totalHabits) * 100)
      }
    })
    
    // Convertir en tableau et trier par date
    const sortedHistory = Object.values(historyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    return NextResponse.json(sortedHistory)
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    )
  }
} 