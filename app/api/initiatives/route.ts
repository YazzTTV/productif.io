import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const { title, description, objectiveActionId } = body

    // Vérifier que l'action appartient à un objectif d'une mission de l'utilisateur
    const action = await prisma.objectiveAction.findFirst({
      where: {
        id: objectiveActionId,
        objective: {
          mission: {
            userId: user.id,
          },
        },
      },
    })

    if (!action) {
      return new NextResponse("Action non trouvée", { status: 404 })
    }

    const initiative = await prisma.initiative.create({
      data: {
        title,
        description,
        objectiveAction: {
          connect: {
            id: objectiveActionId
          }
        }
      },
    })

    return NextResponse.json(initiative)
  } catch (error) {
    console.error("[INITIATIVES_POST]", error)
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
    const objectiveActionId = searchParams.get("objectiveActionId")

    if (!objectiveActionId) {
      return new NextResponse("ID d'action requis", { status: 400 })
    }

    const initiatives = await prisma.initiative.findMany({
      where: {
        objectiveActionId,
        objectiveAction: {
          objective: {
            mission: {
              userId: user.id,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(initiatives)
  } catch (error) {
    console.error("[INITIATIVES_GET]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 