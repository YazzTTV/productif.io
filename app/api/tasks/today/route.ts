import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfToday, endOfToday } from "date-fns"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const today = startOfToday()
    const endToday = endOfToday()

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        OR: [
          {
            // Tâches dues aujourd'hui (complétées ou non)
            dueDate: {
              lte: endToday,
              gte: today
            }
          },
          {
            // Tâches planifiées pour aujourd'hui (complétées ou non)
            scheduledFor: {
              lte: endToday,
              gte: today
            }
          },
          {
            // Tâches complétées aujourd'hui
            updatedAt: {
              lte: endToday,
              gte: today
            },
            completed: true
          },
          {
            // Tâches en retard
            dueDate: {
              lt: today
            },
            completed: false
          }
        ]
      },
      orderBy: [
        { completed: "asc" },
        { priority: "asc" },
        { dueDate: "asc" }
      ],
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 20
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("[TASKS_TODAY_GET]", error)
    return NextResponse.json({ error: "Erreur lors du chargement des tâches" }, { status: 500 })
  }
} 