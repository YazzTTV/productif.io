import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, subDays } from "date-fns"

export async function GET() {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: "Non authentifié" }),
        { status: 401 }
      )
    }

    // Date d'aujourd'hui et date d'il y a 30 jours
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
    const thirtyDaysAgo = subDays(today, 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)
    
    // Récupérer toutes les habitudes de l'utilisateur
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id
      },
      include: {
        entries: {
          where: {
            date: {
              gte: thirtyDaysAgo,
              lte: today
            }
          }
        }
      }
    })
    
    // Préparer les données pour chaque jour
    const historyData: Record<string, {
      date: string
      count: number
      percentage: number
      habits: {
        name: string
        completed: boolean
      }[]
    }> = {}
    
    // Préparer les entrées pour chaque jour dans la plage de 30 jours
    for (let i = 0; i <= 30; i++) {
      const date = subDays(today, i)
      const dateStr = format(date, "yyyy-MM-dd")
      
      // Récupérer le jour de la semaine
      const dayOfWeek = format(date, "EEEE").toLowerCase()
      
      // Filtrer les habitudes qui devraient être suivies ce jour
      const habitsForDay = habits.filter(habit => {
        if (habit.frequency === "daily") return true
        if (habit.frequency === "weekly" && habit.daysOfWeek.includes(dayOfWeek)) return true
        return false
      })
      
      // Déterminer quelles habitudes ont été complétées ce jour
      const habitsStatus = habitsForDay.map(habit => {
        const completed = habit.entries.some(
          entry => format(new Date(entry.date), "yyyy-MM-dd") === dateStr && entry.completed
        )
        
        return {
          name: habit.name,
          completed
        }
      })
      
      // Calculer les statistiques pour ce jour
      const completedCount = habitsStatus.filter(h => h.completed).length
      
      historyData[dateStr] = {
        date: dateStr,
        count: completedCount,
        percentage: habitsForDay.length > 0 ? Math.round((completedCount / habitsForDay.length) * 100) : 0,
        habits: habitsStatus
      }
    }
    
    return NextResponse.json(historyData)
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique des habitudes:", error)
    return new NextResponse(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500 }
    )
  }
} 