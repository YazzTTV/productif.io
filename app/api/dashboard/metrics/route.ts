import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, startOfDay, endOfDay, isSameDay } from "date-fns"

export async function GET() {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    console.log("[METRICS] Récupération des métriques pour l'utilisateur:", user.id)

    // Récupération des tâches du jour
    const today = new Date()
    const startOfDayTime = startOfDay(today)
    const endOfDayTime = endOfDay(today)
    
    // Normalisation de la date pour les habitudes (midi pour éviter les problèmes de fuseau horaire)
    const normalizedDate = startOfDay(today)
    normalizedDate.setHours(12, 0, 0, 0)

    console.log("[METRICS] Date aujourd'hui:", today.toISOString())
    console.log("[METRICS] Début de la journée:", startOfDayTime.toISOString())
    console.log("[METRICS] Fin de la journée:", endOfDayTime.toISOString())
    console.log("[METRICS] Date normalisée pour habitudes:", normalizedDate.toISOString())
    console.log("[METRICS] Fuseau horaire serveur:", Intl.DateTimeFormat().resolvedOptions().timeZone)

    // Récupérer TOUTES les tâches récentes
    const recentTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
      }
    })

    console.log("[METRICS] TOUTES les tâches non filtrées:", 
      JSON.stringify(recentTasks.map(task => ({
        id: task.id,
        title: task.title,
        createdAt: task.createdAt,
        dueDate: task.dueDate,
        scheduledFor: task.scheduledFor,
        completed: task.completed
      })), null, 2))

    // Récupérer les tâches créées aujourd'hui (pour débogage)
    const tasksCreatedToday = recentTasks.filter(task => 
      isSameDay(new Date(task.createdAt), today)
    )

    console.log("[METRICS] Tâches créées aujourd'hui après filtrage:", 
      JSON.stringify(tasksCreatedToday.map(task => ({
        id: task.id,
        title: task.title,
        createdAt: task.createdAt,
        dueDate: task.dueDate,
        scheduledFor: task.scheduledFor,
        completed: task.completed
      })), null, 2))
    console.log("[METRICS] Nombre de tâches créées aujourd'hui:", tasksCreatedToday.length)
    
    // Récupérer les tâches PLANIFIÉES pour aujourd'hui 
    // 1. Tâches avec dueDate aujourd'hui
    // 2. Tâches avec scheduledFor aujourd'hui
    // 3. Tâches créées aujourd'hui sans date d'échéance ou date de planification
    const plannedTodayTasks = recentTasks.filter(task => {
      // Si la tâche a une date d'échéance aujourd'hui
      if (task.dueDate && isSameDay(new Date(task.dueDate), today)) {
        return true
      }
      
      // Si la tâche est planifiée pour aujourd'hui
      if (task.scheduledFor && isSameDay(new Date(task.scheduledFor), today)) {
        return true
      }
      
      // Si la tâche a été créée aujourd'hui et n'a pas de date d'échéance ou date de planification
      if (isSameDay(new Date(task.createdAt), today) && !task.dueDate && !task.scheduledFor) {
        return true
      }
      
      return false
    })

    // SIMPLIFICATION DU CALCUL
    // Considérer que toutes les tâches créées aujourd'hui font partie des tâches planifiées pour aujourd'hui
    const simplifiedPlannedTasks = tasksCreatedToday;
    console.log("[METRICS] SOLUTION SIMPLIFIÉE - Toutes les tâches créées aujourd'hui:", simplifiedPlannedTasks.length)
    
    // Récupérer les tâches complétées aujourd'hui
    const completedToday = recentTasks.filter(task => {
      return task.completed && task.updatedAt && isSameDay(new Date(task.updatedAt), today)
    })

    console.log("[METRICS] Tâches complétées aujourd'hui après filtrage:", 
      JSON.stringify(completedToday.map(task => ({
        id: task.id,
        title: task.title,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completed: task.completed
      })), null, 2))
    console.log("[METRICS] Nombre de tâches complétées aujourd'hui:", completedToday.length)

    // Calculer le taux de complétion uniquement pour les tâches PLANIFIÉES SIMPLIFIÉES
    const simplifiedCompletedTasks = simplifiedPlannedTasks.filter(task => task.completed)
    const simplifiedCompletionRate = simplifiedPlannedTasks.length > 0 
      ? Math.round((simplifiedCompletedTasks.length / simplifiedPlannedTasks.length) * 100) 
      : 0

    console.log("[METRICS] Tâches simplifiées planifiées:", simplifiedPlannedTasks.length)
    console.log("[METRICS] Tâches simplifiées complétées:", simplifiedCompletedTasks.length)
    console.log("[METRICS] Taux de complétion simplifié:", simplifiedCompletionRate)

    // Récupération des habitudes du jour
    // Obtenir le jour en anglais car les jours sont stockés en anglais dans la base de données
    const currentDayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
    console.log("[METRICS] Jour de la semaine actuel:", currentDayOfWeek)
    
    // Récupérer toutes les habitudes de l'utilisateur avec leurs entrées pour aujourd'hui
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
        // Filtrer pour ne garder que les habitudes pour ce jour de la semaine
        daysOfWeek: {
          has: currentDayOfWeek
        }
      },
      include: {
        entries: {
          where: {
            // Utiliser la date normalisée pour la cohérence avec l'API habits/today
            date: normalizedDate
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    console.log("[METRICS] Nombre d'habitudes trouvées pour", currentDayOfWeek, ":", habits.length)
    
    // Filtrer les habitudes complétées (celles qui ont une entrée avec completed=true)
    const completedTodayHabits = habits.filter(habit => 
      habit.entries.some(entry => entry.completed)
    )

    console.log("[METRICS] Habitudes complétées aujourd'hui:", completedTodayHabits.length)

    // Calculer le taux de complétion uniquement pour les habitudes du jour
    const habitsCompletionRate = habits.length > 0 
      ? Math.round((completedTodayHabits.length / habits.length) * 100) 
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
      simplifiedCompletionRate * 0.6, // 60% du score basé sur les tâches
      habitsCompletionRate * 0.4  // 40% du score basé sur les habitudes
    ]

    const productivityScore = Math.round(
      productivityFactors.reduce((sum, factor) => sum + factor, 0)
    )

    // Calcul de la tendance (pour simuler, nous utilisons une valeur aléatoire)
    // En production, on comparerait avec les jours précédents
    const randomChange = Math.floor(Math.random() * 20) - 10
    const trend = randomChange > 0 ? "up" : randomChange < 0 ? "down" : "neutral"

    const response = {
      tasks: {
        today: simplifiedPlannedTasks.length,
        completed: simplifiedCompletedTasks.length,
        completionRate: simplifiedCompletionRate,
        totalCompletedToday: completedToday.length,
        createdToday: tasksCreatedToday.length
      },
      habits: {
        today: habits.length,
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
      },
      debug: {
        serverTime: today.toISOString(),
        normalizedDate: normalizedDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }

    console.log("[METRICS] Réponse finale:", JSON.stringify(response, null, 2))

    return NextResponse.json(response)
  } catch (error) {
    console.error("[METRICS_ERROR] Erreur lors de la récupération des métriques:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
} 