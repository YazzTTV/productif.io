import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { verifyApiToken } from "@/lib/api-token"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null

    // Vérifier d'abord l'authentification par token API
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = await verifyApiToken(token)
      if (decoded) {
        userId = decoded.userId
      } else {
        return NextResponse.json(
          { error: "Token API invalide ou expiré" }, 
          { status: 401 }
        )
      }
    } else {
      // Sinon, utiliser l'authentification par cookie de session
      const user = await getAuthUser()
      if (!user) {
        return NextResponse.json(
          { error: "Non authentifié" }, 
          { status: 401 }
        )
      }
      userId = user.id
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Non authentifié" }, 
        { status: 401 }
      )
    }

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" }, 
        { status: 404 }
      )
    }

    // Récupérer toutes les données de l'utilisateur avec leurs IDs
    const [
      tasks,
      habits,
      projects,
      missions,
      objectives,
      timeEntries,
      processes,
      userCompany,
      userGamification,
      userAchievements
    ] = await Promise.all([
      // Tâches
      prisma.task.findMany({
        where: { userId: user.id },
        select: { 
          id: true, 
          title: true, 
          completed: true, 
          projectId: true,
          processId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20 // Limiter pour éviter trop de données
      }),

      // Habitudes
      prisma.habit.findMany({
        where: { userId: user.id },
        select: { 
          id: true, 
          name: true, 
          frequency: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Projets
      prisma.project.findMany({
        where: { userId: user.id },
        select: { 
          id: true, 
          name: true, 
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Missions
      prisma.mission.findMany({
        where: { userId: user.id },
        select: { 
          id: true, 
          title: true, 
          year: true, 
          quarter: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Objectifs
      prisma.objective.findMany({
        where: { 
          mission: { userId: user.id }
        },
        select: { 
          id: true, 
          title: true, 
          missionId: true, 
          progress: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),

      // Entrées de temps
      prisma.timeEntry.findMany({
        where: { userId: user.id },
        select: { 
          id: true, 
          description: true, 
          startTime: true,
          endTime: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Processus
      prisma.process.findMany({
        where: { userId: user.id },
        select: { 
          id: true, 
          name: true, 
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Entreprise de l'utilisateur
      prisma.userCompany.findFirst({
        where: { userId: user.id },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),

      // Gamification de l'utilisateur
      prisma.userGamification.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          totalPoints: true,
          level: true,
          currentStreak: true
        }
      }),

      // Achievements de l'utilisateur
      prisma.userAchievement.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          achievementId: true,
          unlockedAt: true
        },
        orderBy: { unlockedAt: 'desc' },
        take: 10
      })
    ])

    // Récupérer aussi quelques entrées d'habitudes récentes
    const habitEntries = habits.length > 0 ? await prisma.habitEntry.findMany({
      where: { 
        habitId: { in: habits.map((h: any) => h.id) }
      },
      select: {
        id: true,
        habitId: true,
        date: true,
        completed: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    }) : []

    // Récupérer quelques actions des objectifs
    const actions = objectives.length > 0 ? await prisma.objectiveAction.findMany({
      where: {
        objectiveId: { in: objectives.map((o: any) => o.id) }
      },
      select: {
        id: true,
        title: true,
        objectiveId: true,
        progress: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 15
    }) : []

    // Récupérer tous les achievements disponibles
    const allAchievements = await prisma.achievement.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        rarity: true
      },
      take: 10
    })

    // Construire la réponse avec tous les IDs organisés
    const response = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || null
      },

      // IDs organisés par catégorie pour faciliter l'utilisation
      ids: {
        user: user.id,
        tasks: tasks.map(t => t.id),
        habits: habits.map(h => h.id),
        habitEntries: habitEntries.map(he => he.id),
        projects: projects.map(p => p.id),
        missions: missions.map(m => m.id),
        objectives: objectives.map(o => o.id),
        actions: actions.map(a => a.id),
        processes: processes.map(pr => pr.id),
        timeEntries: timeEntries.map(te => te.id),
        userAchievements: userAchievements.map(ua => ua.id),
        allAchievements: allAchievements.map(a => a.id),
        company: userCompany?.company?.id || null,
        userCompany: userCompany?.id || null,
        gamification: userGamification?.id || null
      },

      // Statistiques rapides
      counts: {
        tasks: tasks.length,
        tasksCompleted: tasks.filter(t => t.completed).length,
        tasksIncomplete: tasks.filter(t => !t.completed).length,
        habits: habits.length,
        habitEntries: habitEntries.length,
        habitEntriesCompleted: habitEntries.filter(he => he.completed).length,
        projects: projects.length,
        missions: missions.length,
        objectives: objectives.length,
        actions: actions.length,
        processes: processes.length,
        timeEntries: timeEntries.length,
        userAchievements: userAchievements.length,
        allAchievements: allAchievements.length
      },

      // Exemples d'utilisation des endpoints
      examples: {
        tasks: {
          list: "GET /api/tasks",
          create: "POST /api/tasks",
          update: tasks.length > 0 ? `PATCH /api/tasks/${tasks[0].id}` : "PATCH /api/tasks/{taskId}",
          delete: tasks.length > 0 ? `DELETE /api/tasks/${tasks[0].id}` : "DELETE /api/tasks/{taskId}"
        },
        habits: {
          list: "GET /api/habits",
          create: "POST /api/habits",
          entries: habits.length > 0 ? `GET /api/habits/${habits[0].id}/entries` : "GET /api/habits/{habitId}/entries",
          complete: habits.length > 0 ? `POST /api/habits/${habits[0].id}/entries` : "POST /api/habits/{habitId}/entries"
        }
      },

      // Métadonnées
      meta: {
        timestamp: new Date().toISOString(),
        authMethod: authHeader ? 'api-token' : 'session-cookie',
        version: "1.0",
        note: "Cet endpoint fournit un aperçu complet de toutes les données de l'utilisateur avec les IDs correspondants"
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("Erreur lors de la récupération des IDs:", error)
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des IDs",
        details: error.message
      },
      { status: 500 }
    )
  }
} 