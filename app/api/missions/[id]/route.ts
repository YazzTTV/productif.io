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

    // Vérifier que la mission appartient à l'utilisateur
    const mission = await prisma.mission.findUnique({
      where: {
        id,
      },
      include: {
        objectives: {
          include: {
            actions: true,
          },
        },
      },
    })

    if (!mission) {
      return new NextResponse("Mission non trouvée", { status: 404 })
    }

    if (mission.userId !== user.id) {
      return new NextResponse("Non autorisé", { status: 403 })
    }

    // Supprimer d'abord les actions de chaque objectif
    for (const objective of mission.objectives) {
      await prisma.action.deleteMany({
        where: {
          objectiveId: objective.id,
        },
      })
    }

    // Supprimer ensuite les objectifs
    await prisma.objective.deleteMany({
      where: {
        missionId: id,
      },
    })

    // Enfin, supprimer la mission
    await prisma.mission.delete({
      where: {
        id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[MISSIONS_DELETE]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 