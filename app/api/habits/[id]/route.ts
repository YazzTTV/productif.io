import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Vérifier si une habitude est une habitude par défaut
function isDefaultHabit(habitName: string) {
  return habitName.toLowerCase().includes("apprentissage") || 
         habitName.toLowerCase().includes("note de sa journée")
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value
    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    // Récupérer les données du corps de la requête
    const body = await request.json()
    const { name, description, color, daysOfWeek, userCategoryOverride } = body

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

    // Vérifier si c'est une habitude par défaut (non modifiable)
    if (isDefaultHabit(habit.name)) {
      return NextResponse.json(
        { error: "Cette habitude par défaut ne peut pas être modifiée" },
        { status: 403 }
      )
    }

    const data: any = {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(daysOfWeek !== undefined ? { daysOfWeek } : {}),
    }

    // RESET MUST WORK (null is valid)
    if ("userCategoryOverride" in body) {
      data.userCategoryOverride = userCategoryOverride
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(updatedHabit)
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'habitude:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value
    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const userId = decoded.userId

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

    // Vérifier si c'est une habitude par défaut (non supprimable)
    if (isDefaultHabit(habit.name)) {
      return NextResponse.json(
        { error: "Cette habitude par défaut ne peut pas être supprimée" },
        { status: 403 }
      )
    }

    // Supprimer l'habitude
    await prisma.habit.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'habitude:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
} 