import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const events = await prisma.warMapEvent.findMany({
      where: {
        userId: user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("[WAR_MAP_EVENTS_GET]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const { title, description, startDate, endDate, projectId, color } = body

    if (!title || !startDate || !endDate) {
      return new NextResponse("Données manquantes", { status: 400 })
    }

    const event = await prisma.warMapEvent.create({
      data: {
        title,
        description,
        startDate,
        endDate,
        color,
        userId: user.id,
        ...(projectId ? { projectId } : {}),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("[WAR_MAP_EVENTS_POST]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 