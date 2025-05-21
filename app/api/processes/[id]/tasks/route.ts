import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

// GET /api/processes/[id]/tasks - Récupérer toutes les tâches associées à un processus
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = params

    // Vérifier que le processus appartient à l'utilisateur
    const process = await prisma.process.findUnique({
      where: {
        id,
        userId: user.id
      }
    })

    if (!process) {
      return NextResponse.json(
        { error: "Processus non trouvé ou n'appartenant pas à l'utilisateur" },
        { status: 404 }
      )
    }

    // Récupérer les tâches associées au processus
    const tasks = await prisma.task.findMany({
      where: {
        processId: id,
        userId: user.id
      },
      orderBy: [
        { completed: "asc" },
        { order: "desc" }
      ],
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

    return NextResponse.json({ 
      process,
      tasks
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches du processus:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tâches du processus" },
      { status: 500 }
    )
  }
} 