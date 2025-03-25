import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "@/lib/jwt"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const payload = await verify(token)
    const userId = payload.userId

    // Vérifier que l'habitude appartient à l'utilisateur
    const habit = await prisma.habit.findUnique({
      where: { id: params.id },
    })

    if (!habit) {
      return NextResponse.json(
        { error: "Habitude non trouvée" },
        { status: 404 }
      )
    }

    if (habit.userId !== userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      )
    }

    // Vérifier que l'entrée existe et appartient à l'habitude
    const entry = await prisma.habitEntry.findUnique({
      where: { id: params.entryId },
    })

    if (!entry) {
      return NextResponse.json(
        { error: "Entrée non trouvée" },
        { status: 404 }
      )
    }

    if (entry.habitId !== params.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      )
    }

    // Récupérer les données de la requête
    const data = await request.json()
    const { completed, note } = data

    // Mettre à jour l'entrée
    const updatedEntry = await prisma.habitEntry.update({
      where: { id: params.entryId },
      data: {
        completed,
        note: note || null,
      },
    })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'entrée:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const payload = await verify(token)
    const userId = payload.userId

    // Vérifier que l'habitude appartient à l'utilisateur
    const habit = await prisma.habit.findUnique({
      where: { id: params.id },
    })

    if (!habit) {
      return NextResponse.json(
        { error: "Habitude non trouvée" },
        { status: 404 }
      )
    }

    if (habit.userId !== userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      )
    }

    // Vérifier que l'entrée existe et appartient à l'habitude
    const entry = await prisma.habitEntry.findUnique({
      where: { id: params.entryId },
    })

    if (!entry) {
      return NextResponse.json(
        { error: "Entrée non trouvée" },
        { status: 404 }
      )
    }

    if (entry.habitId !== params.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      )
    }

    // Supprimer l'entrée
    await prisma.habitEntry.delete({
      where: { id: params.entryId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'entrée:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
} 