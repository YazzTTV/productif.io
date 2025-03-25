import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    console.log("[MISSIONS_GET] Début de la requête")
    const user = await getAuthUser()
    if (!user) {
      console.log("[MISSIONS_GET] Utilisateur non authentifié")
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quarter = parseInt(searchParams.get("quarter") || "0")
    const year = parseInt(searchParams.get("year") || "0")

    console.log("[MISSIONS_GET] Paramètres reçus:", { quarter, year })

    if (!quarter || !year) {
      console.log("[MISSIONS_GET] Paramètres manquants")
      return new NextResponse("Paramètres manquants", { status: 400 })
    }

    const mission = await prisma.mission.findFirst({
      where: {
        userId: user.id,
        quarter,
        year,
      },
      include: {
        objectives: {
          include: {
            actions: {
              include: {
                initiative: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    if (mission) {
      // Calculer la progression globale basée sur les objectifs principaux
      const objectivesProgress = mission.objectives.map(objective => {
        // Calculer le total des actions pour cet objectif
        const totalTarget = objective.actions.reduce((sum, action) => sum + (action.target || 0), 0)
        const totalCurrent = objective.actions.reduce((sum, action) => sum + (action.current || 0), 0)
        
        // Calculer le pourcentage de progression de l'objectif
        const progress = totalTarget > 0 ? Math.min(100, (totalCurrent / totalTarget) * 100) : 0

        // Mettre à jour l'objectif avec sa progression
        prisma.objective.update({
          where: { id: objective.id },
          data: {
            target: totalTarget,
            current: totalCurrent,
            progress,
          },
        }).catch(error => {
          console.error("[MISSIONS_GET] Erreur lors de la mise à jour de l'objectif:", error)
        })

        return progress
      })

      // Calculer la moyenne des progressions des objectifs
      const averageProgress = objectivesProgress.length > 0
        ? objectivesProgress.reduce((sum, progress) => sum + progress, 0) / objectivesProgress.length
        : 0

      // Mettre à jour la mission avec la progression calculée
      const updatedMission = await prisma.mission.update({
        where: { id: mission.id },
        data: {
          progress: averageProgress,
          target: 100, // La cible est toujours 100%
          current: averageProgress, // La valeur actuelle est égale à la progression
        },
        include: {
          objectives: {
            include: {
              actions: {
                include: {
                  initiative: true,
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      })

      console.log("[MISSIONS_GET] Mission mise à jour avec progression:", updatedMission)
      return NextResponse.json(updatedMission)
    }

    console.log("[MISSIONS_GET] Aucune mission trouvée")
    return NextResponse.json(null)
  } catch (error) {
    console.error("[MISSIONS_GET] Erreur détaillée:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const { title, quarter, year } = body

    // Vérifier si une mission existe déjà pour ce trimestre et cette année
    const existingMission = await prisma.mission.findFirst({
      where: {
        userId: user.id,
        quarter,
        year,
      },
    })

    if (existingMission) {
      return new NextResponse(
        "Une mission existe déjà pour ce trimestre",
        { status: 400 }
      )
    }

    const mission = await prisma.mission.create({
      data: {
        title,
        quarter,
        year,
        userId: user.id,
        target: 100,
        current: 0,
        progress: 0,
      },
      include: {
        objectives: {
          include: {
            actions: {
              include: {
                initiative: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(mission)
  } catch (error) {
    console.error("[MISSIONS_POST]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 