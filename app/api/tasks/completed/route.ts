import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const completedTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        completed: true
      },
      orderBy: {
        updatedAt: "desc"
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

    return NextResponse.json({ tasks: completedTasks })
  } catch (error) {
    console.error("[TASKS_COMPLETED_GET]", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tâches terminées" },
      { status: 500 }
    )
  }
} 