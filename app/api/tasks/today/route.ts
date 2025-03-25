import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { startOfToday, endOfToday } from "date-fns"

const JWT_SECRET = "un_secret_tres_securise_pour_jwt_tokens"

async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return null
  }

  try {
    const decoded = verify(token, JWT_SECRET)
    return { id: (decoded as any).userId }
  } catch (error) {
    return null
  }
}

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const today = startOfToday()
    const endToday = endOfToday()

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: {
          lte: endToday,
          gte: today
        },
        completed: false
      },
      orderBy: [
        { order: "desc" }
      ],
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("[TASKS_TODAY_GET]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 