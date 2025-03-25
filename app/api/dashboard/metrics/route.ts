import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"

export async function GET() {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: "Non authentifié" }),
        { status: 401 }
      )
    }

    // Récupération des tâches du jour
    const today = new Date()
    const todayStr = format(today, "yyyy-MM-dd")
    const startOfDay = new Date(todayStr)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(todayStr)
    endOfDay.setHours(23, 59, 59, 999)

    const todayTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        OR: [
          {
            dueDate: {
              gte: startOfDay,
              lte: endOfDay,
            }
          },
          {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            dueDate: null,
          }
        ]
      }
    })

    const completedTodayTasks = todayTasks.filter(task => task.completed)
    const tasksCompletionRate = todayTasks.length > 0 
      ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) 
      : 0

    // Récupération des habitudes du jour
    // Obtenir le jour en anglais car les jours sont stockés en anglais dans la base de données
    const currentDayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
    
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
      },
      include: {
        entries: {
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }
      }
    })

    // Filtrer pour ne garder que les habitudes assignées au jour actuel
    const todayHabits = habits.filter(habit => habit.daysOfWeek.includes(currentDayOfWeek))

    const completedTodayHabits = todayHabits.filter(habit => 
      habit.entries.some(entry => entry.completed)
    )

    // Calculer le taux de complétion uniquement pour les habitudes du jour
    const habitsCompletionRate = todayHabits.length > 0 
      ? Math.round((completedTodayHabits.length / todayHabits.length) * 100) 
      : 0

    // Calcul du streak (séries) d'habitudes - à implémenter plus tard
    // Pour le moment, on utilise une valeur fictive
    const longestStreak = 5

    // Récupération des objectifs depuis le modèle Objective
    const objectives = await prisma.objective.findMany({
      where: {
        mission: {
          userId: user.id
        }
      }
    })

    const objectivesProgress = objectives.length > 0
      ? Math.round(objectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) / objectives.length)
      : 0

    // Calcul du score de productivité basé sur les tâches et habitudes
    // C'est un calcul simplifié qui pourrait être amélioré avec plus de données
    const productivityFactors = [
      tasksCompletionRate * 0.6, // 60% du score basé sur les tâches
      habitsCompletionRate * 0.4  // 40% du score basé sur les habitudes
    ]

    const productivityScore = Math.round(
      productivityFactors.reduce((sum, factor) => sum + factor, 0)
    )

    // Calcul de la tendance (pour simuler, nous utilisons une valeur aléatoire)
    // En production, on comparerait avec les jours précédents
    const randomChange = Math.floor(Math.random() * 20) - 10
    const trend = randomChange > 0 ? "up" : randomChange < 0 ? "down" : "neutral"

    return NextResponse.json({
      tasks: {
        today: todayTasks.length,
        completed: completedTodayTasks.length,
        completionRate: tasksCompletionRate
      },
      habits: {
        today: todayHabits.length,
        completed: completedTodayHabits.length,
        completionRate: habitsCompletionRate,
        streak: longestStreak
      },
      objectives: {
        count: objectives.length,
        progress: objectivesProgress
      },
      productivity: {
        score: productivityScore,
        trend,
        change: Math.abs(randomChange)
      }
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des métriques:", error)
    return new NextResponse(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500 }
    )
  }
} 