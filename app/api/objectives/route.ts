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
    const { title, missionId, target, current } = body

    // Vérifier que la mission appartient à l'utilisateur
    const mission = await prisma.mission.findFirst({
      where: {
        id: missionId,
        userId: user.id,
      },
    })

    if (!mission) {
      return new NextResponse("Mission non trouvée", { status: 404 })
    }

    const objective = await prisma.objective.create({
      data: {
        title,
        missionId,
        target: target ?? 100,
        current: current ?? 0,
      },
    })

    return NextResponse.json(objective)
  } catch (error) {
    console.error("[OBJECTIVES_POST]", error)
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
    const missionId = searchParams.get("missionId")

    if (!missionId) {
      return new NextResponse("ID de mission requis", { status: 400 })
    }

    const objectives = await prisma.objective.findMany({
      where: {
        missionId,
        mission: {
          userId: user.id,
        },
      },
      include: {
        actions: {
          include: {
            initiative: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(objectives)
  } catch (error) {
    console.error("[OBJECTIVES_GET]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 