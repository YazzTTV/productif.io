import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTaskOrder } from "@/lib/tasks"

// GET /api/tasks/[id] - Récupérer une tâche spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return new Response("Non authentifié", { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return new Response("Non authentifié", { status: 401 })
    }

    const userId = decoded.userId

    const task = await prisma.task.findUnique({
      where: {
        id: params.id,
        userId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })

    if (!task) {
      return new Response("Tâche non trouvée", { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("[TASK_GET]", error)
    return new Response("Erreur lors de la récupération de la tâche", { status: 500 })
  }
}

// PATCH /api/tasks/[id] - Mettre à jour une tâche
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return new Response("Non authentifié", { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return new Response("Non authentifié", { status: 401 })
    }

    const userId = decoded.userId
    const { title, description, priority, energyLevel, dueDate, projectId, completed } = await request.json()

    // Convertir les valeurs numériques en chaînes pour le calcul de l'ordre
    const priorityString = priority !== null ? `P${priority}` : "P3"
    const energyString = energyLevel !== null ? {
      0: "Extrême",
      1: "Élevé",
      2: "Moyen",
      3: "Faible"
    }[energyLevel] : "Moyen"

    // Calculer l'ordre
    const order = calculateTaskOrder(priorityString, energyString)

    const task = await prisma.task.update({
      where: {
        id: params.id,
        userId
      },
      data: {
        title,
        description,
        priority,
        energyLevel,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
        completed,
        order
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("[TASK_PATCH]", error)
    return new Response("Erreur lors de la modification de la tâche", { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Supprimer une tâche
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const task = await prisma.task.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      )
    }

    if (task.userId !== userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      )
    }

    await prisma.task.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[TASK_DELETE]", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la tâche" },
      { status: 500 }
    )
  }
}

