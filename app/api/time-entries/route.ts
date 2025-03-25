import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Fonction utilitaire pour vérifier l'authentification
async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return null
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret")
    return { id: (decoded as any).id }
  } catch {
    return null
  }
}

// GET /api/time-entries - Récupérer toutes les entrées de temps de l'utilisateur
export async function GET(req: Request) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const url = new URL(req.url)
    const projectId = url.searchParams.get("projectId")
    const taskId = url.searchParams.get("taskId")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    const whereClause: any = {
      userId: user.id,
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    if (taskId) {
      whereClause.taskId = taskId
    }

    if (startDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      whereClause.startTime = {
        ...(whereClause.startTime || {}),
        lte: new Date(endDate),
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      orderBy: {
        startTime: "desc",
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json({ timeEntries })
  } catch (error) {
    console.error("Erreur lors de la récupération des entrées de temps:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des entrées de temps" }, { status: 500 })
  }
}

// POST /api/time-entries - Créer une nouvelle entrée de temps
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const userId = decoded.userId
    const body = await request.json()
    const { taskId, description, duration } = body

    // Créer l'entrée de temps
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + duration * 1000) // Convertir la durée de secondes en millisecondes

    const timeEntry = await prisma.timeEntry.create({
      data: {
        startTime,
        endTime,
        description,
        taskId,
        userId,
      },
    })

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error("[TIME_ENTRIES_POST]", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'entrée de temps" },
      { status: 500 }
    )
  }
}

