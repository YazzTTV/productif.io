import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

// PATCH /api/tasks/[id]/process - Assigner ou retirer un processus à une tâche
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = params
    const { processId } = await request.json()

    // Vérifier que la tâche existe et appartient à l'utilisateur
    const task = await prisma.task.findUnique({
      where: {
        id,
        userId: user.id
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: "Tâche non trouvée ou n'appartenant pas à l'utilisateur" },
        { status: 404 }
      )
    }

    // Si processId est null, cela signifie qu'on veut retirer le processus de la tâche
    if (processId !== null) {
      // Vérifier que le processus existe et appartient à l'utilisateur
      const process = await prisma.process.findUnique({
        where: {
          id: processId,
          userId: user.id
        }
      })

      if (!process) {
        return NextResponse.json(
          { error: "Processus non trouvé ou n'appartenant pas à l'utilisateur" },
          { status: 404 }
        )
      }
    }

    // Mettre à jour la tâche avec le nouveau processus (ou null pour le retirer)
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { 
        processId,
        updatedAt: new Date()
      },
      include: {
        process: true,
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Erreur lors de l'assignation du processus à la tâche:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'assignation du processus à la tâche" },
      { status: 500 }
    )
  }
} 