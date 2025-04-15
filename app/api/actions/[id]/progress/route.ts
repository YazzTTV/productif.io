import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const { id } = params
    if (!id) {
      return new NextResponse("ID de l'action manquant", { status: 400 })
    }

    const body = await request.json()
    console.log("[ACTIONS_PROGRESS_PATCH] Body reçu:", body)

    const { target, current } = body
    if (target === undefined || current === undefined) {
      console.log("[ACTIONS_PROGRESS_PATCH] Valeurs manquantes:", { target, current })
      return new NextResponse("Les valeurs target et current sont requises", { status: 400 })
    }

    // Conversion en nombres
    const targetNum = Number(target)
    const currentNum = Number(current)

    if (isNaN(targetNum) || isNaN(currentNum)) {
      console.log("[ACTIONS_PROGRESS_PATCH] Valeurs invalides:", { target, current, targetNum, currentNum })
      return new NextResponse("Les valeurs doivent être des nombres", { status: 400 })
    }

    // Vérifier que l'action existe et appartient à l'utilisateur
    const action = await prisma.objectiveAction.findFirst({
      where: {
        id,
        objective: {
          mission: {
            userId: user.id,
          },
        },
      },
      include: {
        objective: true,
      },
    })

    if (!action) {
      console.log("[ACTIONS_PROGRESS_PATCH] Action non trouvée:", id)
      return new NextResponse("Action non trouvée", { status: 404 })
    }

    console.log("[ACTIONS_PROGRESS_PATCH] Action trouvée:", action)

    // Calculer le pourcentage de progression
    const progress = targetNum > 0 ? Math.min(100, (currentNum / targetNum) * 100) : 0

    try {
      // Mettre à jour l'action
      const updatedAction = await prisma.objectiveAction.update({
        where: {
          id,
        },
        data: {
          target: targetNum,
          current: currentNum,
          progress,
        },
        include: {
          initiative: true,
        },
      })

      console.log("[ACTIONS_PROGRESS_PATCH] Action mise à jour:", updatedAction)

      // Mettre à jour la progression de l'objectif
      const actions = await prisma.objectiveAction.findMany({
        where: {
          objectiveId: action.objective.id,
        },
      })

      console.log("[ACTIONS_PROGRESS_PATCH] Actions trouvées:", actions)

      const totalTarget = actions.reduce((sum, a) => sum + (a.target || 0), 0)
      const totalCurrent = actions.reduce((sum, a) => sum + (a.current || 0), 0)
      const totalProgress = totalTarget > 0 ? Math.min(100, (totalCurrent / totalTarget) * 100) : 0

      console.log("[ACTIONS_PROGRESS_PATCH] Calculs totaux:", { totalTarget, totalCurrent, totalProgress })

      const updatedObjective = await prisma.objective.update({
        where: {
          id: action.objective.id,
        },
        data: {
          target: totalTarget,
          current: totalCurrent,
        },
        include: {
          mission: true,
        },
      })

      console.log("[ACTIONS_PROGRESS_PATCH] Objectif mis à jour:", updatedObjective)

      // Mettre à jour la progression de la mission
      const objectives = await prisma.objective.findMany({
        where: {
          missionId: updatedObjective.missionId,
        },
      })

      console.log("[ACTIONS_PROGRESS_PATCH] Objectifs de la mission:", objectives)

      const missionTotalTarget = objectives.reduce((sum, obj) => sum + (obj.target || 0), 0)
      const missionTotalCurrent = objectives.reduce((sum, obj) => sum + (obj.current || 0), 0)
      const missionProgress = missionTotalTarget > 0 ? Math.min(100, (missionTotalCurrent / missionTotalTarget) * 100) : 0

      console.log("[ACTIONS_PROGRESS_PATCH] Calculs de la mission:", { 
        missionTotalTarget, 
        missionTotalCurrent, 
        missionProgress 
      })

      const updatedMission = await prisma.mission.update({
        where: {
          id: updatedObjective.missionId,
        },
        data: {
          target: missionTotalTarget,
          current: missionTotalCurrent,
          progress: missionProgress,
        },
      })

      console.log("[ACTIONS_PROGRESS_PATCH] Mission mise à jour:", updatedMission)

      return NextResponse.json(updatedAction)
    } catch (error) {
      console.error("[ACTIONS_PROGRESS_PATCH] Erreur Prisma détaillée:", error)
      if (error instanceof Error) {
        return new NextResponse(`Erreur lors de la mise à jour: ${error.message}`, { status: 500 })
      }
      return new NextResponse("Erreur lors de la mise à jour dans la base de données", { status: 500 })
    }
  } catch (error) {
    console.error("[ACTIONS_PROGRESS_PATCH] Erreur générale:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 