import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { apiAuth } from "@/middleware/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null
    let authMethod = 'session-cookie'

    // Vérifier d'abord l'authentification par token API
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Utiliser le middleware apiAuth pour l'authentification API
      const authResponse = await apiAuth(req, {
        requiredScopes: ['habits:read'] // Scope minimal requis
      })
      
      // Si l'authentification a échoué, retourner la réponse d'erreur
      if (authResponse) {
        return authResponse
      }
      
      // Extraire l'ID de l'utilisateur à partir de l'en-tête (ajouté par le middleware)
      userId = req.headers.get('x-api-user-id')
      authMethod = 'api-token'
      
      if (!userId) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
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
        role: user.role || null
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
        authMethod: authMethod,
        note: "Cet endpoint fournit les IDs les plus récents de chaque type d'entité pour faciliter les tests API"
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("Erreur lors de la récupération des IDs rapides:", error)
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des IDs rapides",
        details: error.message
      },
      { status: 500 }
    )
  }
} 