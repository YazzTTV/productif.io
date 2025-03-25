import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, subDays } from "date-fns"
import { fr } from "date-fns/locale"

export async function GET() {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: "Non authentifié" }),
        { status: 401 }
      )
    }

    // Récupérer les données des 7 derniers jours
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
    const data = []
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      // Format du jour de la semaine en abrégé
      const dayName = format(date, "EEE", { locale: fr }).charAt(0).toUpperCase() + 
                     format(date, "EEE", { locale: fr }).slice(1)
      
      // Nombre total de tâches pour ce jour
      const totalTasks = await prisma.task.count({
        where: {
          userId: user.id,
          OR: [
            {
              dueDate: {
                gte: startOfDay,
                lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
              }
            },
            {
              createdAt: {
                gte: startOfDay,
                lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
              },
              dueDate: null,
            }
          ]
        }
      })
      
      // Nombre de tâches terminées pour ce jour
      const completedTasks = await prisma.task.count({
        where: {
          userId: user.id,
          completed: true,
          OR: [
            {
              dueDate: {
                gte: startOfDay,
                lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
              }
            },
            {
              createdAt: {
                gte: startOfDay,
                lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
              },
              dueDate: null,
            }
          ]
        }
      })
      
      data.push({
        date: dayName,
        completed: completedTasks,
        total: totalTasks || 0 // Assurer qu'on a au moins 0 si pas de tâches
      })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error)
    return new NextResponse(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500 }
    )
  }
} 