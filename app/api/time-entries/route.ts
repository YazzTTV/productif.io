import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Augmenter le timeout pour les requêtes complexes (30 secondes)
export const maxDuration = 30

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
  const startTime = Date.now()
  const routeName = "[TIME_ENTRIES]"
  
  try {
    console.log(`${routeName} ⏱️  DÉBUT - Route: /api/time-entries - Timestamp: ${new Date().toISOString()}`)
    
    const user = await getAuthUser()

    if (!user) {
      console.log(`${routeName} ❌ ERREUR - Non authentifié après ${Date.now() - startTime}ms`)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log(`${routeName} ✅ Utilisateur authentifié: ${user.id} - Temps: ${Date.now() - startTime}ms`)

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

    const dbStartTime = Date.now()
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
        deepWorkSession: {
          select: {
            id: true,
            status: true,
            type: true,
          },
        },
      },
    })
    console.log(`${routeName} 📊 Time entries récupérés: ${timeEntries.length} - Temps DB: ${Date.now() - dbStartTime}ms`)

    const totalTime = Date.now() - startTime
    console.log(`${routeName} ✅ SUCCÈS - Route terminée en ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)

    return NextResponse.json({ timeEntries })
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`${routeName} ❌ ERREUR - Route échouée après ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)
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

    const userId = (decoded as any).id || (decoded as any).userId
    console.log('[TIME_ENTRIES_POST] userId utilisé:', userId, 'decoded:', JSON.stringify(decoded))
    
    const body = await request.json()
    const { taskId, projectId, description, duration, startTime: clientStartTime, endTime: clientEndTime, note } = body

    // Récupérer les détails de la tâche pour vérifier son projet
    let taskProjectId = null;
    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { projectId: true }
      });
      taskProjectId = task?.projectId;
    }

    // Utiliser les heures de début et de fin envoyées par le client
    const startTime = new Date(clientStartTime);
    const endTime = new Date(clientEndTime);

    // Valider que les dates sont valides
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.error("[TIME_ENTRIES_POST] Dates invalides:", { clientStartTime, clientEndTime });
      return NextResponse.json(
        { error: "Les dates de début et de fin sont invalides" },
        { status: 400 }
      );
    }

    // Calculer la durée réelle en secondes entre début et fin
    const durationInSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    // Vérifier que la durée est d'au moins 1 seconde
    if (durationInSeconds < 1) {
      console.error("[TIME_ENTRIES_POST] Durée trop courte:", durationInSeconds);
      return NextResponse.json(
        { error: "La durée de l'entrée de temps doit être d'au moins 1 seconde" },
        { status: 400 }
      );
    }

    // Log pour débogage
    console.log(`[TIME_ENTRIES_POST] Création d'une entrée de temps:`, {
      userId,
      taskId,
      projectId: projectId || taskProjectId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationInSeconds,
      note
    });

    // Créer l'entrée de temps
    const timeEntry = await prisma.timeEntry.create({
      data: {
        startTime,
        endTime,
        description: note || description, // Utiliser note ou description, selon ce qui est disponible
        taskId,
        projectId: projectId || taskProjectId, // Utiliser le projectId de la tâche s'il existe
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

