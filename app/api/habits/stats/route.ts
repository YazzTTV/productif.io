import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from "date-fns"

export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const today = new Date()
    // Obtenir le jour en anglais car les jours sont stockés en anglais dans la base de données
    const currentDay = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

    // Définir l'intervalle pour les 30 derniers jours
    const thirtyDaysAgo = subDays(today, 29) // 29 pour avoir 30 jours avec aujourd'hui inclus
    
    // Générer un tableau avec tous les jours de l'intervalle
    const dateInterval = eachDayOfInterval({
      start: startOfDay(thirtyDaysAgo),
      end: endOfDay(today)
    })

    // Récupérer les habitudes de l'utilisateur
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
      },
      include: {
        entries: {
          where: {
            date: {
              gte: startOfDay(thirtyDaysAgo),
              lte: endOfDay(today),
            },
          },
        },
      },
    })

    // Statistiques pour aujourd'hui
    // Filtrer les habitudes pour ne garder que celles assignées au jour actuel
    const todayHabits = habits.filter(habit => habit.daysOfWeek.includes(currentDay))
    const totalHabits = todayHabits.length
    
    // Compter uniquement les habitudes complétées pour aujourd'hui parmi celles qui sont assignées à ce jour
    const completedHabits = todayHabits.filter(habit => 
      habit.entries.some(entry => 
        entry.completed && 
        startOfDay(new Date(entry.date)).getTime() === startOfDay(today).getTime()
      )
    ).length
    
    // Calculer le taux de complétion en pourcentage, seulement si des habitudes sont assignées à ce jour
    const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0

    // Statistiques pour les 30 derniers jours
    const dailyStats = dateInterval.map(date => {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      
      // Ne prendre en compte que les habitudes assignées à ce jour de la semaine
      const dayHabits = habits.filter(habit => habit.daysOfWeek.includes(dayName))
      const dayTotal = dayHabits.length
      
      // Compter les habitudes complétées pour ce jour
      const dayCompleted = dayHabits.filter(habit => 
        habit.entries.some(entry => 
          entry.completed && 
          startOfDay(new Date(entry.date)).getTime() === startOfDay(date).getTime()
        )
      ).length
      
      // Calculer le taux de complétion, uniquement s'il y a des habitudes assignées à ce jour
      const dayCompletionRate = dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0
      
      return {
        date: format(date, 'yyyy-MM-dd'),
        formattedDate: format(date, 'dd/MM'),
        total: dayTotal,
        completed: dayCompleted,
        completionRate: Math.round(dayCompletionRate)
      }
    })

    return NextResponse.json({
      totalHabits,
      completedHabits,
      completionRate,
      dailyStats
    })
  } catch (error) {
    console.error("[HABITS_STATS_GET]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 