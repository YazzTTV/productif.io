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

    // Vérifier que l'objectif appartient à l'utilisateur
    const objective = await prisma.objective.findUnique({
      where: {
        id,
      },
      include: {
        actions: true,
        mission: true,
      },
    })

    if (!objective) {
      return new NextResponse("Objectif non trouvé", { status: 404 })
    }

    if (objective.mission.userId !== user.id) {
      return new NextResponse("Non autorisé", { status: 403 })
    }

    // Supprimer d'abord les actions de l'objectif
    await prisma.objectiveAction.deleteMany({
      where: {
        objectiveId: id,
      },
    })

    // Ensuite, supprimer l'objectif
    await prisma.objective.delete({
      where: {
        id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[OBJECTIVES_DELETE]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 