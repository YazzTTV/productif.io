import { PrismaClient } from '@prisma/client'
import { startOfDay, subDays, format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

const prisma = new PrismaClient()

async function testWeeklyProductivity(userId: string) {
  console.log('\n📊 TEST: Weekly Productivity API\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    const today = new Date()
    const weeklyData = []

    // Récupérer toutes les tâches de l'utilisateur une seule fois
    const allTasks = await prisma.task.findMany({
      where: {
        userId: userId
      }
    })

    console.log(`✅ Tâches récupérées: ${allTasks.length}`)

    // Calculer les données pour les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const dateStart = startOfDay(date)
      const dateEnd = new Date(dateStart)
      dateEnd.setHours(23, 59, 59, 999)

      // Normaliser la date à midi pour la comparaison
      const normalizedDate = new Date(dateStart)
      normalizedDate.setHours(12, 0, 0, 0)

      // Récupérer les habitudes actives pour ce jour
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      const habits = await prisma.habit.findMany({
        where: {
          userId: userId,
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

      // Filtrer les tâches pour ce jour spécifique
      const tasksForDay = allTasks.filter(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null
        const scheduledFor = task.scheduledFor ? new Date(task.scheduledFor) : null
        const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null

        const isDueThisDay = dueDate && 
          dueDate >= dateStart && 
          dueDate <= dateEnd

        const isScheduledThisDay = scheduledFor && 
          scheduledFor >= dateStart && 
          scheduledFor <= dateEnd

        const isCompletedThisDay = task.completed && updatedAt && 
          updatedAt >= dateStart && 
          updatedAt <= dateEnd

        return isDueThisDay || isScheduledThisDay || isCompletedThisDay
      })

      const totalTasks = tasksForDay.length
      const completedTasks = tasksForDay.filter(t => t.completed).length
      const tasksProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // Calculer le Productivity Score
      let productivityScore = 0
      if (activeHabits > 0 && totalTasks > 0) {
        productivityScore = Math.round((habitsProgress + tasksProgress) / 2)
      } else if (activeHabits > 0) {
        productivityScore = Math.round(habitsProgress)
      } else if (totalTasks > 0) {
        productivityScore = Math.round(tasksProgress)
      }

      const dayLabel = format(date, "EEE")

      weeklyData.push({
        day: dayLabel,
        date: format(date, "yyyy-MM-dd"),
        score: productivityScore,
        habitsProgress: Math.round(habitsProgress),
        tasksProgress: Math.round(tasksProgress),
        completedHabits,
        activeHabits,
        completedTasks,
        totalTasks
      })

      console.log(`📅 ${dayLabel} (${format(date, "yyyy-MM-dd")}):`)
      console.log(`   Habitudes: ${completedHabits}/${activeHabits} (${Math.round(habitsProgress)}%)`)
      console.log(`   Tâches: ${completedTasks}/${totalTasks} (${Math.round(tasksProgress)}%)`)
      console.log(`   Score: ${productivityScore}%`)
    }

    console.log('\n✅ Weekly Productivity calculé avec succès')
    console.log(`📊 Total de jours: ${weeklyData.length}`)
    return weeklyData
  } catch (error) {
    console.error('❌ Erreur lors du calcul de Weekly Productivity:', error)
    throw error
  }
}

async function testAnalyticsStats(userId: string, period: 'week' | 'month' | 'trimester' | 'year' = 'week') {
  console.log(`\n📊 TEST: Analytics Stats API (${period})\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
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

    console.log(`📅 Période: ${format(startDate, "yyyy-MM-dd")} à ${format(endDate, "yyyy-MM-dd")}`)

    // 1. Calculer le temps de deep work pour la période
    const deepWorkResult = await prisma.$queryRaw<Array<{ total_hours: number }>>`
      SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM (te."endTime" - te."startTime"))/3600), 0) as total_hours
      FROM "DeepWorkSession" dws
      JOIN "TimeEntry" te ON te.id = dws."timeEntryId"
      WHERE dws."userId" = ${userId}
        AND dws.status = 'completed'
        AND te."endTime" IS NOT NULL
        AND te."startTime" >= ${startDate}
        AND te."startTime" <= ${endDate}
    `
    const focusHours = Math.round(Number(deepWorkResult[0]?.total_hours || 0))
    console.log(`✅ Focus Hours: ${focusHours}h`)

    // 2. Récupérer toutes les tâches de l'utilisateur
    const allTasks = await prisma.task.findMany({
      where: {
        userId: userId
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
    console.log(`✅ Tâches: ${completedTasks}/${totalTasks} complétées`)

    // 3. Calculer les habitudes et leur pourcentage de complétion
    const daysInPeriod: Date[] = []
    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      daysInPeriod.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    console.log(`📅 Calcul pour ${daysInPeriod.length} jours...`)

    let totalHabitsProgress = 0
    let daysWithHabits = 0

    for (const date of daysInPeriod) {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      const normalizedDate = new Date(date)
      normalizedDate.setHours(12, 0, 0, 0)

      const habits = await prisma.habit.findMany({
        where: {
          userId: userId,
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
    console.log(`✅ Habits Completion: ${avgHabitsCompletion}% (${daysWithHabits} jours avec habitudes)`)

    // 4. Calculer la moyenne du score de productivité
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
          userId: userId,
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
    console.log(`✅ Avg Productivity: ${avgProductivity}% (${daysWithData} jours avec données)`)

    const stats = {
      avgProductivity,
      totalTasks: completedTasks,
      habitsCompletion: avgHabitsCompletion,
      focusHours,
    }

    console.log('\n📊 RÉSULTATS FINAUX:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📈 Avg Productivity: ${stats.avgProductivity}%`)
    console.log(`✅ Total Tasks: ${stats.totalTasks}`)
    console.log(`🔥 Habits Completion: ${stats.habitsCompletion}%`)
    console.log(`⏰ Focus Hours: ${stats.focusHours}h`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return stats
  } catch (error) {
    console.error('❌ Erreur lors du calcul de Analytics Stats:', error)
    throw error
  }
}

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: npx tsx scripts/test-analytics-apis.ts <email>')
    process.exit(1)
  }

  try {
    console.log(`\n🔍 Recherche de l'utilisateur: ${email}\n`)

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.error(`❌ Utilisateur non trouvé avec l'email: ${email}`)
      return
    }

    console.log(`✅ Utilisateur trouvé: ${user.name || user.email} (ID: ${user.id})\n`)

    // Test Weekly Productivity
    await testWeeklyProductivity(user.id)

    // Test Analytics Stats pour chaque période
    for (const period of ['week', 'month', 'trimester', 'year'] as const) {
      await testAnalyticsStats(user.id, period)
    }

    console.log('\n✅ Tous les tests sont terminés avec succès!')
  } catch (error) {
    console.error('💥 Erreur lors de l\'exécution du script:', error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()

