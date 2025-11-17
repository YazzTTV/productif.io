import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromRequest } from "@/lib/auth"
import { startOfDay, subDays, format } from "date-fns"

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const today = new Date()
    const weeklyData = []

    // Récupérer toutes les tâches de l'utilisateur une seule fois
    const allTasks = await prisma.task.findMany({
      where: {
        userId: user.id
      }
    })

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
          userId: user.id,
          daysOfWeek: {
            has: dayName
          },
          isActive: {
            not: false
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
      // Une tâche appartient à un jour si :
      // 1. Elle a une dueDate ce jour
      // 2. Elle a une scheduledFor ce jour
      // 3. Elle a été complétée ce jour (updatedAt)
      const tasksForDay = allTasks.filter(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null
        const scheduledFor = task.scheduledFor ? new Date(task.scheduledFor) : null
        const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null

        // Vérifier si la tâche est due ce jour
        const isDueThisDay = dueDate && 
          dueDate >= dateStart && 
          dueDate <= dateEnd

        // Vérifier si la tâche est planifiée ce jour
        const isScheduledThisDay = scheduledFor && 
          scheduledFor >= dateStart && 
          scheduledFor <= dateEnd

        // Vérifier si la tâche a été complétée ce jour
        const isCompletedThisDay = task.completed && updatedAt && 
          updatedAt >= dateStart && 
          updatedAt <= dateEnd

        return isDueThisDay || isScheduledThisDay || isCompletedThisDay
      })

      const totalTasks = tasksForDay.length
      const completedTasks = tasksForDay.filter(t => t.completed).length
      const tasksProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // Calculer le Productivity Score (moyenne des habitudes et tâches)
      let productivityScore = 0
      if (activeHabits > 0 && totalTasks > 0) {
        productivityScore = Math.round((habitsProgress + tasksProgress) / 2)
      } else if (activeHabits > 0) {
        productivityScore = Math.round(habitsProgress)
      } else if (totalTasks > 0) {
        productivityScore = Math.round(tasksProgress)
      }

      // Format du jour (Mon, Tue, etc.)
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
    }

    return NextResponse.json({ weeklyData })
  } catch (error) {
    console.error("Erreur lors de la récupération des données hebdomadaires:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données hebdomadaires" },
      { status: 500 }
    )
  }
}

