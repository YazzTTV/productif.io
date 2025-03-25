import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

// Fonction utilitaire pour vérifier l'authentification
async function getAuthUser() {
  const token = cookies().get("auth_token")?.value

  if (!token) {
    return null
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret")
    return { id: (decoded as any).id }
  } catch (error) {
    return null
  }
}

// GET /api/time-entries/[id] - Récupérer une entrée de temps spécifique
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const timeEntry = await prisma.timeEntry.findUnique({
      where: {
        id: params.id,
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

    if (!timeEntry) {
      return NextResponse.json({ error: "Entrée de temps non trouvée" }, { status: 404 })
    }

    // Vérifier que l'entrée appartient à l'utilisateur
    if (timeEntry.userId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    return NextResponse.json({ timeEntry })
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entrée de temps:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération de l'entrée de temps" }, { status: 500 })
  }
}

// PATCH /api/time-entries/[id] - Mettre à jour une entrée de temps
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'entrée existe et appartient à l'utilisateur
    const existingTimeEntry = await prisma.timeEntry.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingTimeEntry) {
      return NextResponse.json({ error: "Entrée de temps non trouvée" }, { status: 404 })
    }

    if (existingTimeEntry.userId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { startTime, endTime, duration, note, taskId, projectId } = await req.json()

    const updatedTimeEntry = await prisma.timeEntry.update({
      where: {
        id: params.id,
      },
      data: {
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : null,
        duration,
        note,
        taskId: taskId || null,
        projectId: projectId || null,
      },
    })

    return NextResponse.json({ timeEntry: updatedTimeEntry })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'entrée de temps:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour de l'entrée de temps" }, { status: 500 })
  }
}

// DELETE /api/time-entries/[id] - Supprimer une entrée de temps
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'entrée existe et appartient à l'utilisateur
    const existingTimeEntry = await prisma.timeEntry.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingTimeEntry) {
      return NextResponse.json({ error: "Entrée de temps non trouvée" }, { status: 404 })
    }

    if (existingTimeEntry.userId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    await prisma.timeEntry.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true, message: "Entrée de temps supprimée avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'entrée de temps:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression de l'entrée de temps" }, { status: 500 })
  }
}

