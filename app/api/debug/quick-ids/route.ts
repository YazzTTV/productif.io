import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer juste les premiers IDs de chaque entité
    const [
      firstTask,
      firstHabit,
      firstProject,
      firstMission,
      firstObjective,
      firstProcess,
      userCompany,
      userGamification
    ] = await Promise.all([
      prisma.task.findFirst({
        where: { userId: user.id },
        select: { id: true, title: true, completed: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.habit.findFirst({
        where: { userId: user.id },
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.project.findFirst({
        where: { userId: user.id },
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.mission.findFirst({
        where: { userId: user.id },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.objective.findFirst({
        where: { mission: { userId: user.id } },
        select: { id: true, title: true, missionId: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.process.findFirst({
        where: { userId: user.id },
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.userCompany.findFirst({
        where: { userId: user.id },
        include: { company: { select: { id: true, name: true } } }
      }),
      
      prisma.userGamification.findUnique({
        where: { userId: user.id },
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
        where: { userId: user.id },
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      
      // IDs essentiels pour les tests rapides
      quickIds: {
        userId: user.id,
        taskId: firstTask?.id || null,
        habitId: firstHabit?.id || null,
        habitEntryId: firstHabitEntry?.id || null,
        projectId: firstProject?.id || null,
        missionId: firstMission?.id || null,
        objectiveId: firstObjective?.id || null,
        actionId: firstAction?.id || null,
        processId: firstProcess?.id || null,
        timeEntryId: firstTimeEntry?.id || null,
        companyId: userCompany?.company?.id || null,
        userCompanyId: userCompany?.id || null,
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
        company: userCompany?.company || null,
        gamification: userGamification
      },
      
      // Exemples d'utilisation
      examples: {
        updateTask: `PATCH /api/tasks/${firstTask?.id || 'TASK_ID'}`,
        completeHabit: `POST /api/habits/${firstHabit?.id || 'HABIT_ID'}/entries`,
        updateProject: `PATCH /api/projects/${firstProject?.id || 'PROJECT_ID'}`,
        updateObjective: `PATCH /api/objectives/${firstObjective?.id || 'OBJECTIVE_ID'}`,
        updateMission: `PATCH /api/missions/${firstMission?.id || 'MISSION_ID'}`,
        updateAction: `PATCH /api/objectives/actions/${firstAction?.id || 'ACTION_ID'}/progress`,
        deleteTimeEntry: `DELETE /api/time-entries/${firstTimeEntry?.id || 'TIME_ENTRY_ID'}`
      },
      
      meta: {
        timestamp: new Date().toISOString(),
        note: "Cet endpoint fournit les IDs les plus récents de chaque type d'entité pour faciliter les tests API"
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Erreur lors de la récupération des IDs rapides:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des IDs rapides" },
      { status: 500 }
    )
  }
} 