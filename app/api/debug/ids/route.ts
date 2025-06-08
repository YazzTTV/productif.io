import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
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
        role: user.role
      },
      
      // IDs principaux pour les requêtes courantes
      quickIds: {
        userId: user.id,
        firstTaskId: tasks[0]?.id || null,
        firstHabitId: habits[0]?.id || null,
        firstProjectId: projects[0]?.id || null,
        firstMissionId: missions[0]?.id || null,
        firstObjectiveId: objectives[0]?.id || null,
        firstProcessId: processes[0]?.id || null,
        companyId: userCompany?.company?.id || null,
        gamificationId: userGamification?.id || null
      },

      // Toutes les tâches avec détails
      tasks: {
        count: tasks.length,
        items: tasks,
        ids: tasks.map((t: any) => t.id),
        completedIds: tasks.filter((t: any) => t.completed).map((t: any) => t.id),
        incompleteIds: tasks.filter((t: any) => !t.completed).map((t: any) => t.id)
      },

      // Toutes les habitudes avec détails
      habits: {
        count: habits.length,
        items: habits,
        ids: habits.map((h: any) => h.id)
      },

      // Entrées d'habitudes
      habitEntries: {
        count: habitEntries.length,
        items: habitEntries,
        ids: habitEntries.map((he: any) => he.id),
        completedIds: habitEntries.filter((he: any) => he.completed).map((he: any) => he.id)
      },

      // Projets
      projects: {
        count: projects.length,
        items: projects,
        ids: projects.map((p: any) => p.id)
      },

      // Missions
      missions: {
        count: missions.length,
        items: missions,
        ids: missions.map((m: any) => m.id)
      },

      // Objectifs
      objectives: {
        count: objectives.length,
        items: objectives,
        ids: objectives.map((o: any) => o.id)
      },

      // Actions
      actions: {
        count: actions.length,
        items: actions,
        ids: actions.map((a: any) => a.id)
      },

      // Processus
      processes: {
        count: processes.length,
        items: processes,
        ids: processes.map((p: any) => p.id)
      },

      // Entrées de temps
      timeEntries: {
        count: timeEntries.length,
        items: timeEntries,
        ids: timeEntries.map((te: any) => te.id)
      },

      // Entreprise
      company: userCompany ? {
        id: userCompany.company.id,
        name: userCompany.company.name,
        userCompanyId: userCompany.id
      } : null,

      // Gamification
      gamification: userGamification,

      // Achievements
      achievements: {
        unlocked: {
          count: userAchievements.length,
          items: userAchievements,
          ids: userAchievements.map((ua: any) => ua.id),
          achievementIds: userAchievements.map((ua: any) => ua.achievementId)
        },
        available: {
          count: allAchievements.length,
          items: allAchievements,
          ids: allAchievements.map((a: any) => a.id)
        }
      },

      // Métadonnées utiles
      meta: {
        timestamp: new Date().toISOString(),
        totalEntities: {
          tasks: tasks.length,
          habits: habits.length,
          habitEntries: habitEntries.length,
          projects: projects.length,
          missions: missions.length,
          objectives: objectives.length,
          actions: actions.length,
          processes: processes.length,
          timeEntries: timeEntries.length,
          achievements: userAchievements.length
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Erreur lors de la récupération des IDs:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des IDs" },
      { status: 500 }
    )
  }
} 