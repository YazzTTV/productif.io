import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: "Non authentifié" }),
        { status: 401 }
      )
    }

    // Récupérer la mission en cours (dernier trimestre)
    const currentMission = await prisma.mission.findFirst({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        objectives: true
      }
    })

    if (!currentMission) {
      return NextResponse.json([])
    }

    // Formatter les objectifs pour l'affichage
    const formattedObjectives = currentMission.objectives.map(objective => ({
      id: objective.id,
      title: objective.title,
      missionTitle: `Q${currentMission.quarter} ${currentMission.year}`,
      progress: objective.progress,
      current: objective.current,
      target: objective.target
    }))
    
    return NextResponse.json(formattedObjectives)
  } catch (error) {
    console.error("Erreur lors de la récupération des objectifs:", error)
    return new NextResponse(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500 }
    )
  }
} 