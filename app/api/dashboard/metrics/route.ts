import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, startOfDay, endOfDay, isSameDay, isAfter, isBefore, startOfTomorrow, isTomorrow } from "date-fns"

// Augmenter le timeout pour les requêtes complexes (60 secondes)
export const maxDuration = 60

export async function GET(request: Request) {
  const startTime = Date.now()
  const routeName = "[METRICS]"
  
  try {
    console.log(`${routeName} ⏱️  DÉBUT - Route: /api/dashboard/metrics - Timestamp: ${new Date().toISOString()}`)
    
    const user = await getAuthUser()
    
    if (!user) {
      console.log(`${routeName} ❌ ERREUR - Non authentifié après ${Date.now() - startTime}ms`)
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    console.log(`${routeName} ✅ Utilisateur authentifié: ${user.id} - Temps: ${Date.now() - startTime}ms`)

    // Récupérer le paramètre date de l'URL
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    
    console.log(`${routeName} 📊 Récupération des métriques pour l'utilisateur: ${user.id}`)
    console.log("[METRICS] Paramètre date reçu:", dateParam)

    // Utiliser la date fournie ou la date actuelle
    const now = dateParam ? new Date(dateParam) : new Date()
    const today = startOfDay(now)
    const endToday = endOfDay(now)
    const tomorrow = startOfTomorrow()
    
    // Normalisation de la date pour les habitudes (midi pour éviter les problèmes de fuseau horaire)
    const normalizedDate = startOfDay(now)
    normalizedDate.setHours(12, 0, 0, 0)

    console.log("[METRICS] Date actuelle:", now.toISOString())
    console.log("[METRICS] Date formatée:", format(now, "yyyy-MM-dd HH:mm:ss"))
    console.log("[METRICS] Début d'aujourd'hui:", today.toISOString())
    console.log("[METRICS] Fin d'aujourd'hui:", endToday.toISOString())
    console.log("[METRICS] Début de demain:", tomorrow.toISOString())
    console.log("[METRICS] Date normalisée pour habitudes:", normalizedDate.toISOString())
    console.log("[METRICS] Fuseau horaire serveur:", Intl.DateTimeFormat().resolvedOptions().timeZone)

    // OPTIMISATION: Vérification rapide si l'utilisateur est nouveau (pas de données)
    const [taskCount, habitCount] = await Promise.all([
      prisma.task.count({ where: { userId: user.id } }),
      prisma.habit.count({ where: { userId: user.id } })
    ])

    // Si pas de tâches ni d'habitudes, retourner une réponse vide rapidement
    if (taskCount === 0 && habitCount === 0) {
      console.log("[METRICS] Utilisateur nouveau - retour réponse vide")
      return NextResponse.json({
        tasks: {
          today: 0,
          completed: 0,
          completionRate: 0,
          totalCompletedToday: 0,
          createdToday: 0
        },
        habits: {
          today: 0,
          completed: 0,
          completionRate: 0,
          streak: 0
        },
        objectives: {
          count: 0,
          progress: 0
        },
        productivity: {
          score: 0,
          trend: "neutral",
          change: 0
        },
        debug: {
          serverTime: now.toISOString(),
          normalizedDate: normalizedDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      })
    }

    // Récupérer TOUTES les tâches récentes seulement si nécessaire
    const recentTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
      }
    })

    console.log("[METRICS] Nombre total de tâches non filtrées:", recentTasks.length)

    // Identifier les tâches de demain pour débogage
    const tomorrowTasks = recentTasks.filter(task => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null
      const scheduledFor = task.scheduledFor ? new Date(task.scheduledFor) : null
      return (dueDate && isTomorrow(dueDate)) || (scheduledFor && isTomorrow(scheduledFor))
    })
    console.log("[METRICS] Nombre de tâches trouvées pour DEMAIN:", tomorrowTasks.length)
    
    if (tomorrowTasks.length > 0) {
      tomorrowTasks.forEach(task => {
        console.log(`[METRICS] ⚠️ Tâche demain: ${task.id} - ${task.title} - dueDate: ${task.dueDate?.toISOString() || 'N/A'} - scheduledFor: ${task.scheduledFor?.toISOString() || 'N/A'}`)
      })
    }

    // Récupérer les tâches créées aujourd'hui
    const tasksCreatedToday = recentTasks.filter(task => 
      isSameDay(new Date(task.createdAt), today)
    )

    console.log("[METRICS] Nombre de tâches créées aujourd'hui:", tasksCreatedToday.length)
    
    // Filtrer les tâches pour aujourd'hui avec vérification stricte des dates
    const plannedTodayTasks = recentTasks.filter(task => {
      // Tâche avec dueDate aujourd'hui
      if (task.dueDate && isSameDay(new Date(task.dueDate), today)) {
        return true
      }
      
      // Tâche planifiée pour aujourd'hui
      if (task.scheduledFor && isSameDay(new Date(task.scheduledFor), today)) {
        return true
      }
      
      // Tâche en retard (due avant aujourd'hui, non complétée)
      if (task.dueDate && !task.completed && isBefore(new Date(task.dueDate), today)) {
        return true
      }
      
      // Si la tâche a été créée aujourd'hui et n'a pas de date d'échéance ou date de planification
      if (isSameDay(new Date(task.createdAt), today) && !task.dueDate && !task.scheduledFor) {
        return true
      }
      
      // Exclure explicitement les tâches de demain
      if (task.dueDate && isTomorrow(new Date(task.dueDate))) {
        return false
      }
      
      if (task.scheduledFor && isTomorrow(new Date(task.scheduledFor))) {
        return false
      }
      
      return false
    })

    console.log("[METRICS] Nombre de tâches planifiées pour AUJOURD'HUI:", plannedTodayTasks.length)
    
    // Récupérer les tâches complétées aujourd'hui
    const completedToday = recentTasks.filter(task => {
      return task.completed && task.updatedAt && isSameDay(new Date(task.updatedAt), today)
    })

    console.log("[METRICS] Nombre de tâches complétées aujourd'hui:", completedToday.length)

    // Filtrer les tâches planifiées pour aujourd'hui qui sont complétées
    const plannedAndCompletedToday = plannedTodayTasks.filter(task => task.completed)
    console.log("[METRICS] Tâches planifiées pour aujourd'hui et complétées:", plannedAndCompletedToday.length)

    // Calculer le taux de complétion pour les tâches d'aujourd'hui
    const todayCompletionRate = plannedTodayTasks.length > 0 
      ? Math.round((plannedAndCompletedToday.length / plannedTodayTasks.length) * 100) 
      : 0

    console.log("[METRICS] Taux de complétion des tâches d'aujourd'hui:", todayCompletionRate)

    // Récupération des habitudes du jour
    // Obtenir le jour en anglais car les jours sont stockés en anglais dans la base de données
    const currentDayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
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
      todayCompletionRate * 0.6, // 60% du score basé sur les tâches
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
        today: plannedTodayTasks.length,
        completed: plannedAndCompletedToday.length,
        completionRate: todayCompletionRate,
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
        serverTime: now.toISOString(),
        normalizedDate: normalizedDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }

    const totalTime = Date.now() - startTime
    console.log(`${routeName} ✅ SUCCÈS - Route terminée en ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)
    console.log("[METRICS] Réponse finale:", JSON.stringify(response, null, 2))

    return NextResponse.json(response)
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`${routeName} ❌ ERREUR - Route échouée après ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)
    console.error("[METRICS_ERROR] Erreur lors de la récupération des métriques:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
} 