import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
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
    const body = await request.json()
    
    if (!body.updatedTasks || !Array.isArray(body.updatedTasks)) {
      return NextResponse.json(
        { message: "Format de données invalide" },
        { status: 400 }
      )
    }

    // Vérifier que toutes les tâches appartiennent à l'utilisateur
    const allTaskIds = body.updatedTasks.map((task: any) => task.id)
    
    const userTasks = await prisma.task.findMany({
      where: {
        id: { in: allTaskIds },
        userId
      },
      select: {
        id: true
      }
    })
    
    const userTaskIds = userTasks.map((task: { id: string }) => task.id)
    
    // Vérifier que chaque tâche dans updatedTasks appartient à l'utilisateur
    const unauthorizedTaskIds = allTaskIds.filter((id: string) => !userTaskIds.includes(id))
    
    if (unauthorizedTaskIds.length > 0) {
      return NextResponse.json(
        { message: "Certaines tâches n'appartiennent pas à l'utilisateur" },
        { status: 403 }
      )
    }

    // Mettre à jour l'ordre des tâches
    for (const task of body.updatedTasks) {
      await prisma.task.update({
        where: {
          id: task.id
        },
        data: {
          order: task.order
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la réorganisation des tâches:", error)
    return NextResponse.json(
      { message: "Erreur lors de la réorganisation des tâches" },
      { status: 500 }
    )
  }
} 