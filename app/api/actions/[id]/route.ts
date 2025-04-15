import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const { id } = params

    // Vérifier que l'action appartient à l'utilisateur
    const action = await prisma.objectiveAction.findUnique({
      where: {
        id,
      },
      include: {
        objective: {
          include: {
            mission: true,
          },
        },
        initiative: true,
      },
    })

    if (!action) {
      return new NextResponse("Action non trouvée", { status: 404 })
    }

    if (action.objective.mission.userId !== user.id) {
      return new NextResponse("Non autorisé", { status: 403 })
    }

    // Supprimer d'abord l'initiative associée si elle existe
    if (action.initiative) {
      await prisma.initiative.delete({
        where: {
          objectiveActionId: id,
        },
      })
    }

    // Ensuite, supprimer l'action
    await prisma.objectiveAction.delete({
      where: {
        id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[ACTIONS_DELETE]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 