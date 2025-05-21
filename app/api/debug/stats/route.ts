import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  // Cette route est uniquement pour le débogage
  try {
    // Récupérer le paramètre de requête userId
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 })
    }
    
    // Récupérer les statistiques utilisateur
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            tasks: true,
            projects: true,
            timeEntries: true
          }
        }
      }
    })
    
    if (!userInfo) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }
    
    // Récupérer le nombre de tâches complétées
    const completedTasks = await prisma.task.count({
      where: {
        userId,
        completed: true
      }
    })
    
    // Récupérer les entrées de temps
    const timeEntries = await prisma.timeEntry.aggregate({
      where: {
        userId,
        endTime: { not: null }
      },
      _count: {
        id: true
      }
    })
    
    return NextResponse.json({
      user: userInfo,
      stats: {
        totalTasks: userInfo._count.tasks,
        completedTasks,
        totalProjects: userInfo._count.projects,
        timeEntries: userInfo._count.timeEntries,
        completionRate: userInfo._count.tasks > 0 ? Math.round((completedTasks / userInfo._count.tasks) * 100) : 0
      }
    })
  } catch (error) {
    console.error("[DEBUG_STATS]", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des statistiques" }, { status: 500 })
  }
} 