import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const { title, objectiveId, initiativeId, target = 100, current = 0 } = body

    // Vérifier que l'objectif appartient à une mission de l'utilisateur
    const objective = await prisma.objective.findFirst({
      where: {
        id: objectiveId,
        mission: {
          userId: user.id,
        },
      },
    })

    if (!objective) {
      return new NextResponse("Objectif non trouvé", { status: 404 })
    }

    // Calculer le pourcentage de progression
    const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0

    const actionData: Prisma.ObjectiveActionUncheckedCreateInput = {
      title,
      objectiveId,
      target,
      current,
      progress,
      ...(initiativeId ? { initiativeId } : {}),
    }

    const action = await prisma.objectiveAction.create({
      data: actionData,
      include: {
        initiative: true,
      },
    })

    // Mettre à jour la progression de l'objectif
    const actions = await prisma.objectiveAction.findMany({
      where: {
        objectiveId,
      },
      select: {
        target: true,
        current: true,
      },
    })

    const totalTarget = actions.reduce((sum, action) => sum + (action.target || 0), 0) + target
    const totalCurrent = actions.reduce((sum, action) => sum + (action.current || 0), 0) + current

    await prisma.objective.update({
      where: {
        id: objectiveId,
      },
      data: {
        target: totalTarget,
        current: totalCurrent,
      },
    })

    return NextResponse.json(action)
  } catch (error) {
    console.error("[ACTIONS_POST]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const objectiveId = searchParams.get("objectiveId")

    if (!objectiveId) {
      return new NextResponse("ID d'objectif requis", { status: 400 })
    }

    const actions = await prisma.objectiveAction.findMany({
      where: {
        objectiveId,
        objective: {
          mission: {
            userId: user.id,
          },
        },
      },
      include: {
        initiative: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(actions)
  } catch (error) {
    console.error("[ACTIONS_GET]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 