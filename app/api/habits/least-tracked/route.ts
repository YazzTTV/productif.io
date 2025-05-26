import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

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

export async function GET() {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    // Récupérer toutes les habitudes de l'utilisateur
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        color: true,
        frequency: true,
        daysOfWeek: true,
        createdAt: true
      }
    })
    
    // Calculer le taux de complétion pour chaque habitude sur 7 jours et 30 jours
    const habitsWithRates = await Promise.all(
      habits.map(async (habit) => {
        // Ignorer les habitudes créées il y a moins de 7 jours pour le calcul sur 7 jours
        const habitAge = Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        
        // Calculer les taux de complétion
        const completionRate7Days = habitAge >= 7 
          ? await calculateCompletionRate(habit.id, user.id, 7)
          : null
        
        const completionRate30Days = habitAge >= 7 
          ? await calculateCompletionRate(habit.id, user.id, 30) 
          : null
        
        return {
          id: habit.id,
          name: habit.name,
          color: habit.color,
          completionRate7Days,
          completionRate30Days,
          habitAge
        }
      })
    )
    
    // Filtrer et trier pour les 7 jours
    const habits7Days = habitsWithRates
      .filter(h => h.completionRate7Days !== null)
      .sort((a, b) => (a.completionRate7Days || 0) - (b.completionRate7Days || 0))
      .slice(0, 3)
    
    // Filtrer et trier pour les 30 jours
    const habits30Days = habitsWithRates
      .filter(h => h.completionRate30Days !== null)
      .sort((a, b) => (a.completionRate30Days || 0) - (b.completionRate30Days || 0))
      .slice(0, 3)
    
    // Formater les résultats
    const formattedHabits7Days = habits7Days.map(h => ({
      id: h.id,
      name: h.name,
      color: h.color,
      completionRate: h.completionRate7Days
    }))
    
    const formattedHabits30Days = habits30Days.map(h => ({
      id: h.id,
      name: h.name,
      color: h.color,
      completionRate: h.completionRate30Days
    }))
    
    return NextResponse.json({
      habits7Days: formattedHabits7Days,
      habits30Days: formattedHabits30Days
    })
    
  } catch (error) {
    console.error("[HABITS_LEAST_TRACKED_ERROR]", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
} 