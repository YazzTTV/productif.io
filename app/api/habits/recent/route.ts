import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
      },
      include: {
        entries: {
          orderBy: {
            date: "desc",
          },
          take: 30,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    })

    // Calculer les streaks pour chaque habitude
    const habitsWithStreaks = habits.map(habit => {
      let streak = 0
      let lastCompletedDate = null

      // Trier les entrées par date décroissante
      const sortedEntries = [...habit.entries].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      // Calculer le streak
      for (const entry of sortedEntries) {
        if (entry.completed) {
          if (!lastCompletedDate) {
            lastCompletedDate = new Date(entry.date)
            streak++
          } else {
            const daysDiff = Math.floor(
              (lastCompletedDate.getTime() - new Date(entry.date).getTime()) / 
              (1000 * 60 * 60 * 24)
            )
            if (daysDiff === 1) {
              streak++
            } else {
              break
            }
          }
        } else {
          break
        }
      }

      return {
        ...habit,
        streak,
        lastCompleted: lastCompletedDate?.toISOString(),
        daysOfWeek: habit.daysOfWeek || [],
      }
    })

    return NextResponse.json(habitsWithStreaks)
  } catch (error) {
    console.error("Erreur lors de la récupération des habitudes:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des habitudes" },
      { status: 500 }
    )
  }
} 