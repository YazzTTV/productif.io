import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromRequest } from "@/lib/auth"
import { startOfDay, subDays, subMonths, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachWeekOfInterval, eachMonthOfInterval } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week' // week, month, trimester, year

    const today = new Date()
    const chartData = []

    // Récupérer toutes les tâches de l'utilisateur une seule fois
    const allTasks = await prisma.task.findMany({
      where: {
        userId: user.id
      }
    })

    // Définir les dates selon la période
    let startDate: Date
    let endDate: Date = today

    switch (period) {
      case 'week':
        startDate = startOfDay(subDays(today, 7))
        break
      case 'month':
        startDate = startOfMonth(subMonths(today, 1))
        endDate = endOfMonth(subMonths(today, 1))
        break
      case 'trimester':
        startDate = startOfMonth(subMonths(today, 3))
        endDate = endOfMonth(subMonths(today, 1))
        break
      case 'year':
        startDate = startOfYear(subMonths(today, 12))
        endDate = endOfYear(subMonths(today, 1))
        break
      default:
        startDate = startOfDay(subDays(today, 7))
    }

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    // Récupérer toutes les habitudes avec leurs entrées pour la période
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

    // Fonction pour calculer le score de productivité pour une période donnée
    const calculateProductivityForPeriod = (periodStart: Date, periodEnd: Date) => {
      const normalizedStart = new Date(periodStart)
      normalizedStart.setHours(12, 0, 0, 0)
      const normalizedEnd = new Date(periodEnd)
      normalizedEnd.setHours(12, 0, 0, 0)

      // Calculer les habitudes pour cette période
      let totalHabitsProgress = 0
      let daysWithHabits = 0
      const daysInPeriod: Date[] = []
      let currentDate = new Date(periodStart)
      while (currentDate <= periodEnd) {
        daysInPeriod.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }

      for (const date of daysInPeriod) {
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
        const normalizedDate = new Date(date)
        normalizedDate.setHours(12, 0, 0, 0)

        const dayHabits = allHabits.filter(habit => habit.daysOfWeek.includes(dayName))
        if (dayHabits.length > 0) {
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

      const avgHabitsProgress = daysWithHabits > 0 ? totalHabitsProgress / daysWithHabits : 0

      // Calculer les tâches pour cette période
      const periodTasks = allTasks.filter(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null
        const scheduledFor = task.scheduledFor ? new Date(task.scheduledFor) : null
        const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null

        const isDueInPeriod = dueDate && dueDate >= periodStart && dueDate <= periodEnd
        const isScheduledInPeriod = scheduledFor && scheduledFor >= periodStart && scheduledFor <= periodEnd
        const isCompletedInPeriod = task.completed && updatedAt && updatedAt >= periodStart && updatedAt <= periodEnd

        return isDueInPeriod || isScheduledInPeriod || isCompletedInPeriod
      })

      const totalPeriodTasks = periodTasks.length
      const completedPeriodTasks = periodTasks.filter(t => t.completed).length
      const tasksProgress = totalPeriodTasks > 0 ? (completedPeriodTasks / totalPeriodTasks) * 100 : 0

      // Productivity Score
      let productivityScore = 0
      if (avgHabitsProgress > 0 && tasksProgress > 0) {
        productivityScore = (avgHabitsProgress + tasksProgress) / 2
      } else if (avgHabitsProgress > 0) {
        productivityScore = avgHabitsProgress
      } else if (tasksProgress > 0) {
        productivityScore = tasksProgress
      }

      return {
        score: Math.round(productivityScore),
        habitsProgress: Math.round(avgHabitsProgress),
        tasksProgress: Math.round(tasksProgress),
        completedHabits: Math.round((avgHabitsProgress / 100) * daysWithHabits),
        activeHabits: daysWithHabits,
        completedTasks: completedPeriodTasks,
        totalTasks: totalPeriodTasks
      }
    }

    if (period === 'week') {
      // Calculer les données pour les 7 derniers jours
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i)
        const dateStart = startOfDay(date)
        const dateEnd = new Date(dateStart)
        dateEnd.setHours(23, 59, 59, 999)

        const normalizedDate = new Date(dateStart)
        normalizedDate.setHours(12, 0, 0, 0)

        const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
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

        const tasksForDay = allTasks.filter(task => {
          const dueDate = task.dueDate ? new Date(task.dueDate) : null
          const scheduledFor = task.scheduledFor ? new Date(task.scheduledFor) : null
          const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null

          const isDueThisDay = dueDate && dueDate >= dateStart && dueDate <= dateEnd
          const isScheduledThisDay = scheduledFor && scheduledFor >= dateStart && scheduledFor <= dateEnd
          const isCompletedThisDay = task.completed && updatedAt && updatedAt >= dateStart && updatedAt <= dateEnd

          return isDueThisDay || isScheduledThisDay || isCompletedThisDay
        })

        const totalTasks = tasksForDay.length
        const completedTasks = tasksForDay.filter(t => t.completed).length
        const tasksProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

        let productivityScore = 0
        if (activeHabits > 0 && totalTasks > 0) {
          productivityScore = Math.round((habitsProgress + tasksProgress) / 2)
        } else if (activeHabits > 0) {
          productivityScore = Math.round(habitsProgress)
        } else if (totalTasks > 0) {
          productivityScore = Math.round(tasksProgress)
        }

        chartData.push({
          day: format(date, "EEE"),
          date: format(date, "yyyy-MM-dd"),
          score: productivityScore,
          habitsProgress: Math.round(habitsProgress),
          tasksProgress: Math.round(tasksProgress),
          completedHabits,
          activeHabits,
          completedTasks,
          totalTasks
        })
      }
    } else if (period === 'month') {
      // Agréger par semaine
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate })
      for (let i = 0; i < weeks.length; i++) {
        const weekStart = startOfWeek(weeks[i])
        const weekEnd = endOfWeek(weeks[i])
        const actualEnd = weekEnd > endDate ? endDate : weekEnd

        const weekData = calculateProductivityForPeriod(weekStart, actualEnd)
        chartData.push({
          day: `W${i + 1}`,
          date: format(weekStart, "yyyy-MM-dd"),
          score: weekData.score,
          habitsProgress: weekData.habitsProgress,
          tasksProgress: weekData.tasksProgress,
          completedHabits: weekData.completedHabits,
          activeHabits: weekData.activeHabits,
          completedTasks: weekData.completedTasks,
          totalTasks: weekData.totalTasks
        })
      }
    } else if (period === 'trimester') {
      // Agréger par mois
      const months = eachMonthOfInterval({ start: startDate, end: endDate })
      for (let i = 0; i < months.length; i++) {
        const monthStart = startOfMonth(months[i])
        const monthEnd = endOfMonth(months[i])
        const actualEnd = monthEnd > endDate ? endDate : monthEnd

        const monthData = calculateProductivityForPeriod(monthStart, actualEnd)
        chartData.push({
          day: format(months[i], "MMM"),
          date: format(monthStart, "yyyy-MM-dd"),
          score: monthData.score,
          habitsProgress: monthData.habitsProgress,
          tasksProgress: monthData.tasksProgress,
          completedHabits: monthData.completedHabits,
          activeHabits: monthData.activeHabits,
          completedTasks: monthData.completedTasks,
          totalTasks: monthData.totalTasks
        })
      }
    } else if (period === 'year') {
      // Agréger par trimestre
      const quarters: Date[] = []
      let currentQuarter = startOfMonth(startDate)
      while (currentQuarter <= endDate) {
        quarters.push(new Date(currentQuarter))
        currentQuarter = startOfMonth(subMonths(currentQuarter, -3))
      }

      for (let i = 0; i < quarters.length; i++) {
        const quarterStart = startOfMonth(quarters[i])
        let quarterEnd = endOfMonth(subMonths(quarterStart, 2))
        const actualEnd = quarterEnd > endDate ? endDate : quarterEnd

        const quarterData = calculateProductivityForPeriod(quarterStart, actualEnd)
        chartData.push({
          day: `Q${i + 1}`,
          date: format(quarterStart, "yyyy-MM-dd"),
          score: quarterData.score,
          habitsProgress: quarterData.habitsProgress,
          tasksProgress: quarterData.tasksProgress,
          completedHabits: quarterData.completedHabits,
          activeHabits: quarterData.activeHabits,
          completedTasks: quarterData.completedTasks,
          totalTasks: quarterData.totalTasks
        })
      }
    }

    return NextResponse.json({ weeklyData: chartData })
  } catch (error) {
    console.error("Erreur lors de la récupération des données hebdomadaires:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données hebdomadaires" },
      { status: 500 }
    )
  }
}
