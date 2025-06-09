import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Test sans authentification - récupérer le premier utilisateur de la DB
    const testUser = await prisma.user.findFirst({
      select: { id: true, name: true, email: true }
    })
    
    if (!testUser) {
      return NextResponse.json({ 
        error: "Aucun utilisateur dans la base de données",
        suggestion: "Créez un utilisateur d'abord"
      }, { status: 404 })
    }

    // Récupérer juste les premiers IDs de chaque entité pour cet utilisateur
    const [
      firstTask,
      firstHabit,
      firstProject,
      firstMission,
      firstObjective,
      firstProcess,
      userGamification
    ] = await Promise.all([
      prisma.task.findFirst({
        where: { userId: testUser.id },
        select: { id: true, title: true, completed: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.habit.findFirst({
        where: { userId: testUser.id },
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.project.findFirst({
        where: { userId: testUser.id },
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.mission.findFirst({
        where: { userId: testUser.id },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.objective.findFirst({
        where: { mission: { userId: testUser.id } },
        select: { id: true, title: true, missionId: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.process.findFirst({
        where: { userId: testUser.id },
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.userGamification.findUnique({
        where: { userId: testUser.id },
        select: { id: true, totalPoints: true, level: true }
      })
    ])

    // Récupérer aussi quelques entrées récentes
    const [firstHabitEntry, firstTimeEntry, firstAction] = await Promise.all([
      firstHabit ? prisma.habitEntry.findFirst({
        where: { habitId: firstHabit.id },
        select: { id: true, date: true, completed: true },
        orderBy: { createdAt: 'desc' }
      }) : null,
      
      prisma.timeEntry.findFirst({
        where: { userId: testUser.id },
        select: { id: true, description: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      firstObjective ? prisma.objectiveAction.findFirst({
        where: { objectiveId: firstObjective.id },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' }
      }) : null
    ])

    const response = {
      testMode: true,
      user: {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email
      },
      
      // IDs essentiels pour les tests rapides
      quickIds: {
        userId: testUser.id,
        taskId: firstTask?.id || null,
        habitId: firstHabit?.id || null,
        habitEntryId: firstHabitEntry?.id || null,
        projectId: firstProject?.id || null,
        missionId: firstMission?.id || null,
        objectiveId: firstObjective?.id || null,
        actionId: firstAction?.id || null,
        processId: firstProcess?.id || null,
        timeEntryId: firstTimeEntry?.id || null,
        gamificationId: userGamification?.id || null
      },
      
      // Détails des entités pour contexte
      entities: {
        task: firstTask,
        habit: firstHabit,
        habitEntry: firstHabitEntry,
        project: firstProject,
        mission: firstMission,
        objective: firstObjective,
        action: firstAction,
        process: firstProcess,
        timeEntry: firstTimeEntry,
        gamification: userGamification
      },
      
      // Statistiques rapides
      counts: {
        totalTasks: firstTask ? await prisma.task.count({ where: { userId: testUser.id } }) : 0,
        totalHabits: firstHabit ? await prisma.habit.count({ where: { userId: testUser.id } }) : 0,
        totalProjects: firstProject ? await prisma.project.count({ where: { userId: testUser.id } }) : 0
      },
      
      meta: {
        timestamp: new Date().toISOString(),
        note: "Endpoint de test sans authentification - à supprimer après diagnostic"
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("Erreur lors de la récupération des IDs rapides (test):", error)
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des IDs rapides",
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
} 