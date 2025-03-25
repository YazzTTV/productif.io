import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getAuthUser } from "@/lib/auth"

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  projectId: z.string().optional(),
  color: z.string().min(1),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const validatedData = eventSchema.parse({
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    })

    // Vérifier que l'événement existe et appartient à l'utilisateur
    const existingEvent = await prisma.warMapEvent.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingEvent) {
      return new NextResponse("Événement non trouvé", { status: 404 })
    }

    // Mettre à jour l'événement
    const updatedEvent = await prisma.warMapEvent.update({
      where: {
        id: params.id,
      },
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        projectId: validatedData.projectId || null,
        color: validatedData.color,
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

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error("[WAR_MAP_EVENT_UPDATE]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 