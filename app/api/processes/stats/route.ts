import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

// GET /api/processes/stats - Récupérer les statistiques de tous les processus
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer tous les processus de l'utilisateur
    const processes = await prisma.process.findMany({
      where: {
        userId: user.id
      },
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Pour chaque processus, calculer des statistiques supplémentaires
    const processStats = await Promise.all(
      processes.map(async (process) => {
        // Récupérer le nombre de tâches complétées
        const completedTasksCount = await prisma.task.count({
          where: {
            processId: process.id,
            completed: true
          }
        })

        // Nombre total de tâches
        const totalTasks = process._count.tasks

        // Calculer le pourcentage d'achèvement
        const completionPercentage = totalTasks > 0 
          ? Math.round((completedTasksCount / totalTasks) * 100) 
          : 0

        // Récupérer la tâche la plus récente
        const latestTask = await prisma.task.findFirst({
          where: {
            processId: process.id
          },
          orderBy: {
            updatedAt: "desc"
          },
          select: {
            id: true,
            title: true,
            updatedAt: true
          }
        })

        return {
          id: process.id,
          name: process.name,
          description: process.description,
          createdAt: process.createdAt,
          updatedAt: process.updatedAt,
          totalTasks,
          completedTasks: completedTasksCount,
          completionPercentage,
          latestActivity: latestTask
        }
      })
    )

    return NextResponse.json(processStats)
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques des processus:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques des processus" },
      { status: 500 }
    )
  }
} 