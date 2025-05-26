import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiAuth } from "@/middleware/api-auth"
import { startOfDay, subDays } from "date-fns"

// Fonction pour calculer le taux de complétion pour une période donnée (en jours)
const calculateCompletionRate = async (habitId: string, userId: string, days: number) => {
  const today = new Date()
  const startDate = new Date()
  startDate.setDate(today.getDate() - days)
  
  // Normaliser les dates en UTC à minuit
  startDate.setHours(0, 0, 0, 0)
  
  // Récupérer l'habitude pour connaître sa fréquence et jours programmés
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    select: { frequency: true, daysOfWeek: true }
  })
  
  if (!habit) return 0

  // Récupérer les entrées d'habitude où elles ont été complétées
  const completionLogs = await prisma.habitEntry.findMany({
    where: {
      habitId,
      completed: true,
      date: {
        gte: startDate,
        lte: today
      }
    }
  })

  // Calculer le nombre de jours où l'habitude aurait dû être réalisée
  let expectedDays = 0
  
  // Pour chaque jour dans la période
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(today.getDate() - i)
    
    // Vérifier si c'est un jour programmé (pour les habitudes hebdomadaires)
    if (habit.frequency === "daily") {
      // Pour les habitudes quotidiennes, vérifier les jours de la semaine sélectionnés
      const dayOfWeek = date.getDay()
      // Convertir de 0-6 (dimanche-samedi) à notre format (monday, tuesday, etc.)
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
      const dayName = dayNames[dayOfWeek]
      
      if (habit.daysOfWeek.includes(dayName)) {
        expectedDays++
      }
    } else if (habit.frequency === "weekly") {
      // Pour les habitudes hebdomadaires, on compte une fois par semaine
      // On simplifie en comptant 1 jour sur 7
      if (i % 7 === 0) {
        expectedDays++
      }
    } else if (habit.frequency === "monthly") {
      // Pour les habitudes mensuelles, on compte une fois par mois
      // Simplification: on compte un jour tous les 30 jours
      if (i % 30 === 0) {
        expectedDays++
      }
    }
  }
  
  // Si aucun jour n'était prévu, retourner 0 pour éviter division par zéro
  if (expectedDays === 0) return 0
  
  // Calculer le taux de complétion
  const completionRate = (completionLogs.length / expectedDays) * 100
  
  // Limiter à 100% maximum et arrondir
  return Math.min(100, Math.round(completionRate))
}

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
    // Obtenir la date d'il y a 7 jours
    const sevenDaysAgo = subDays(new Date(), 7)
    
    // Récupérer toutes les habitudes de l'utilisateur avec leurs entrées des 7 derniers jours
    const habits = await prisma.habit.findMany({
      where: {
        userId: userId,
      },
      include: {
        entries: {
          where: {
            date: {
              gte: startOfDay(sevenDaysAgo),
            },
          },
        },
      },
    })

    // Calculer le taux de complétion pour chaque habitude
    const habitsWithCompletionRate = habits.map(habit => {
      const totalEntries = habit.entries.length
      const completedEntries = habit.entries.filter(entry => entry.completed).length
      const completionRate = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0

      return {
        ...habit,
        completionRate,
        totalEntries,
        completedEntries,
      }
    })

    // Trier par taux de complétion croissant (les moins suivies en premier)
    const leastTrackedHabits = habitsWithCompletionRate
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 5) // Prendre les 5 moins suivies

    return NextResponse.json(leastTrackedHabits)
  } catch (error) {
    console.error("Erreur lors de la récupération des habitudes les moins suivies:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des habitudes les moins suivies" },
      { status: 500 }
    )
  }
} 