import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromRequest } from "@/lib/auth"
import { startOfDay, subDays, subMonths, subWeeks, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week' // week, month, trimester, year

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

    // 1. Calculer le temps de deep work pour la période
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
    // Pour chaque jour de la période, calculer le pourcentage de complétion
    const daysInPeriod: Date[] = []
    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      daysInPeriod.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    let totalHabitsProgress = 0
    let daysWithHabits = 0

    for (const date of daysInPeriod) {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      const normalizedDate = new Date(date)
      normalizedDate.setHours(12, 0, 0, 0)

      const habits = await prisma.habit.findMany({
        where: {
          userId: user.id,
          daysOfWeek: {
            has: dayName
          }
        },
        include: {
          entries: {
            where: {
              date: normalizedDate,
              completed: true
            }
          }
        }
      })

      if (habits.length > 0) {
        const activeHabits = habits.length
        const completedHabits = habits.filter(h => h.entries.length > 0).length
        const habitsProgress = (completedHabits / activeHabits) * 100
        totalHabitsProgress += habitsProgress
        daysWithHabits++
      }
    }

    const avgHabitsCompletion = daysWithHabits > 0 
      ? Math.round(totalHabitsProgress / daysWithHabits)
      : 0

    // 4. Calculer la moyenne du score de productivité
    // Pour chaque jour, calculer le productivity score
    let totalProductivityScore = 0
    let daysWithData = 0

    for (const date of daysInPeriod) {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      const normalizedDate = new Date(date)
      normalizedDate.setHours(12, 0, 0, 0)
      const dateStart = startOfDay(date)
      const dateEnd = new Date(dateStart)
      dateEnd.setHours(23, 59, 59, 999)

      // Habitudes
      const habits = await prisma.habit.findMany({
        where: {
          userId: user.id,
          daysOfWeek: {
            has: dayName
          }
        },
        include: {
          entries: {
            where: {
              date: normalizedDate,
              completed: true
            }
          }
        }
      })

      const activeHabits = habits.length
      const completedHabits = habits.filter(h => h.entries.length > 0).length
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
    console.error("Erreur lors de la récupération des statistiques analytics:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques analytics" },
      { status: 500 }
    )
  }
}

