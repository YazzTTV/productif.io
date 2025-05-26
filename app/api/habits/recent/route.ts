import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiAuth } from "@/middleware/api-auth"

export async function GET(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['habits:read']
  })
  
  // Si l'authentification a échoué, retourner la réponse d'erreur
  if (authResponse) {
    return authResponse
  }
  
  // Extraire l'ID de l'utilisateur à partir de l'en-tête (ajouté par le middleware)
  const userId = req.headers.get('x-api-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }

  try {
    const habits = await prisma.habit.findMany({
      where: {
        userId: userId,
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
    console.error("Erreur lors de la récupération des habitudes récentes:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des habitudes récentes" },
      { status: 500 }
    )
  }
} 