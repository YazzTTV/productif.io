import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromRequest } from "@/lib/auth"
import { startOfDay, subDays, subMonths, subWeeks, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"

// Augmenter le timeout pour les requêtes complexes (60 secondes)
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const routeName = "[ANALYTICS_STATS]"
  
  try {
    console.log(`${routeName} ⏱️  DÉBUT - Route: /api/dashboard/analytics-stats - Timestamp: ${new Date().toISOString()}`)
    
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      console.log(`${routeName} ❌ ERREUR - Non authentifié après ${Date.now() - startTime}ms`)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log(`${routeName} ✅ Utilisateur authentifié: ${user.id} - Temps: ${Date.now() - startTime}ms`)

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week' // week, month, trimester, year

    // OPTIMISATION: Vérification rapide si l'utilisateur est nouveau
    const [taskCount, habitCount, deepWorkCount] = await Promise.all([
      prisma.task.count({ where: { userId: user.id } }),
      prisma.habit.count({ where: { userId: user.id } }),
      prisma.deepWorkSession.count({ where: { userId: user.id } })
    ])

    // Si pas de données, retourner une réponse vide rapidement
    if (taskCount === 0 && habitCount === 0 && deepWorkCount === 0) {
      const now = new Date()
      let startDate: Date
      let endDate: Date = now

      switch (period) {
        case 'week':
          startDate = startOfDay(subDays(now, 7))
          break
        case 'month':
          startDate = startOfMonth(subMonths(now, 1))
          endDate = endOfMonth(subMonths(now, 1))
          break
        case 'trimester':
          startDate = startOfMonth(subMonths(now, 3))
          endDate = endOfMonth(subMonths(now, 1))
          break
        case 'year':
          startDate = startOfYear(subMonths(now, 12))
          endDate = endOfYear(subMonths(now, 1))
          break
        default:
          startDate = startOfDay(subDays(now, 7))
      }

      return NextResponse.json({
        period,
        stats: {
          avgProductivity: 0,
          totalTasks: 0,
          habitsCompletion: 0,
          focusHours: 0,
        },
        dateRange: {
          start: format(startDate, "yyyy-MM-dd"),
          end: format(endDate, "yyyy-MM-dd"),
        }
      })
    }

    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    // Définir les dates selon la période
    switch (period) {
      case 'week':
        startDate = startOfDay(subDays(now, 7))
        break
      case 'month':
        startDate = startOfMonth(subMonths(now, 1))
        endDate = endOfMonth(subMonths(now, 1))
        break
      case 'trimester':
        startDate = startOfMonth(subMonths(now, 3))
        endDate = endOfMonth(subMonths(now, 1))
        break
      case 'year':
        startDate = startOfYear(subMonths(now, 12))
        endDate = endOfYear(subMonths(now, 1))
        break
      default:
        startDate = startOfDay(subDays(now, 7))
    }

    // Normaliser les dates
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    // 1. Calculer le temps de deep work pour la période (seulement si nécessaire)
    const deepWorkResult = await prisma.$queryRaw<Array<{ total_hours: number }>>`
      SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM (te."endTime" - te."startTime"))/3600), 0) as total_hours
      FROM "DeepWorkSession" dws
      JOIN "TimeEntry" te ON te.id = dws."timeEntryId"
      WHERE dws."userId" = ${user.id}
        AND dws.status = 'completed'
        AND te."endTime" IS NOT NULL
        AND te."startTime" >= ${startDate}
        AND te."startTime" <= ${endDate}
    `
    const focusHours = Math.round(Number(deepWorkResult[0]?.total_hours || 0))

    // 2. Récupérer toutes les tâches de l'utilisateur
    const allTasks = await prisma.task.findMany({
      where: {
        userId: user.id
      }
    })

    // Filtrer les tâches pour la période
    const tasksInPeriod = allTasks.filter(task => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null
      const scheduledFor = task.scheduledFor ? new Date(task.scheduledFor) : null
      const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null

      const isDueInPeriod = dueDate && dueDate >= startDate && dueDate <= endDate
      const isScheduledInPeriod = scheduledFor && scheduledFor >= startDate && scheduledFor <= endDate
      const isCompletedInPeriod = task.completed && updatedAt && updatedAt >= startDate && updatedAt <= endDate

      return isDueInPeriod || isScheduledInPeriod || isCompletedInPeriod
    })

    const totalTasks = tasksInPeriod.length
    const completedTasks = tasksInPeriod.filter(t => t.completed).length

    // 3. Calculer les habitudes et leur pourcentage de complétion
    // Optimisation: Pour les longues périodes, on calcule directement depuis les entrées
    // Récupérer toutes les habitudes de l'utilisateur
    const allHabits = await prisma.habit.findMany({
      where: {
        userId: user.id
      },
      include: {
        entries: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            },
            completed: true
          }
        }
      }
    })

    // Calculer le pourcentage de complétion moyen
    let totalHabitsProgress = 0
    let daysWithHabits = 0

    // Pour les longues périodes, on échantillonne les jours au lieu de tous les calculer
    const daysInPeriod: Date[] = []
    let currentDate = new Date(startDate)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Si plus de 30 jours, on échantillonne (tous les jours pour week, échantillon pour les autres)
    const sampleInterval = period === 'week' ? 1 : Math.max(1, Math.floor(totalDays / 30))
    
    while (currentDate <= endDate) {
      daysInPeriod.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + sampleInterval)
    }

    for (const date of daysInPeriod) {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      const normalizedDate = new Date(date)
      normalizedDate.setHours(12, 0, 0, 0)

      // Filtrer les habitudes pour ce jour
      const dayHabits = allHabits.filter(habit => habit.daysOfWeek.includes(dayName))
      
      if (dayHabits.length > 0) {
        // Compter les habitudes complétées ce jour
        const completedHabits = dayHabits.filter(h => {
          return h.entries.some(entry => {
            const entryDate = new Date(entry.date)
            entryDate.setHours(12, 0, 0, 0)
            return entryDate.getTime() === normalizedDate.getTime()
          })
        }).length

        const habitsProgress = (completedHabits / dayHabits.length) * 100
        totalHabitsProgress += habitsProgress
        daysWithHabits++
      }
    }

    const avgHabitsCompletion = daysWithHabits > 0 
      ? Math.round(totalHabitsProgress / daysWithHabits)
      : 0

    // 4. Calculer la moyenne du score de productivité
    // Utiliser les mêmes jours échantillonnés que pour les habitudes
    let totalProductivityScore = 0
    let daysWithData = 0

    for (const date of daysInPeriod) {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      const normalizedDate = new Date(date)
      normalizedDate.setHours(12, 0, 0, 0)
      const dateStart = startOfDay(date)
      const dateEnd = new Date(dateStart)
      dateEnd.setHours(23, 59, 59, 999)

      // Habitudes (utiliser les habitudes déjà chargées)
      const dayHabits = allHabits.filter(habit => habit.daysOfWeek.includes(dayName))
      const activeHabits = dayHabits.length
      const completedHabits = dayHabits.filter(h => {
        return h.entries.some(entry => {
          const entryDate = new Date(entry.date)
          entryDate.setHours(12, 0, 0, 0)
          return entryDate.getTime() === normalizedDate.getTime()
        })
      }).length
      const habitsProgress = activeHabits > 0 ? (completedHabits / activeHabits) * 100 : 0

      // Tâches
      const dayTasks = allTasks.filter(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null
        const scheduledFor = task.scheduledFor ? new Date(task.scheduledFor) : null
        const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null

        const isDueThisDay = dueDate && dueDate >= dateStart && dueDate <= dateEnd
        const isScheduledThisDay = scheduledFor && scheduledFor >= dateStart && scheduledFor <= dateEnd
        const isCompletedThisDay = task.completed && updatedAt && updatedAt >= dateStart && updatedAt <= dateEnd

        return isDueThisDay || isScheduledThisDay || isCompletedThisDay
      })

      const totalDayTasks = dayTasks.length
      const completedDayTasks = dayTasks.filter(t => t.completed).length
      const tasksProgress = totalDayTasks > 0 ? (completedDayTasks / totalDayTasks) * 100 : 0

      // Productivity Score
      let productivityScore = 0
      if (activeHabits > 0 && totalDayTasks > 0) {
        productivityScore = (habitsProgress + tasksProgress) / 2
      } else if (activeHabits > 0) {
        productivityScore = habitsProgress
      } else if (totalDayTasks > 0) {
        productivityScore = tasksProgress
      }

      if (productivityScore > 0 || activeHabits > 0 || totalDayTasks > 0) {
        totalProductivityScore += productivityScore
        daysWithData++
      }
    }

    const avgProductivity = daysWithData > 0 
      ? Math.round(totalProductivityScore / daysWithData)
      : 0

    const totalTime = Date.now() - startTime
    console.log(`${routeName} ✅ SUCCÈS - Route terminée en ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)
    
    return NextResponse.json({
      period,
      stats: {
        avgProductivity,
        totalTasks: completedTasks,
        habitsCompletion: avgHabitsCompletion,
        focusHours,
      },
      dateRange: {
        start: format(startDate, "yyyy-MM-dd"),
        end: format(endDate, "yyyy-MM-dd"),
      }
    })
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`${routeName} ❌ ERREUR - Route échouée après ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)
    console.error("Erreur lors de la récupération des statistiques analytics:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques analytics" },
      { status: 500 }
    )
  }
}

