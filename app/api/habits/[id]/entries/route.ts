import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "@/lib/jwt"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, subDays } from "date-fns"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    // Récupérer les entrées des 7 derniers jours
    const today = new Date()
    const sevenDaysAgo = subDays(today, 6)

    const entries = await prisma.habitEntry.findMany({
      where: {
        habitId: params.id,
        date: {
          gte: startOfDay(sevenDaysAgo),
          lte: endOfDay(today),
        },
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Erreur lors de la récupération des entrées:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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

    // Récupérer les données de la requête
    const data = await request.json()
    const { date, completed, note } = data

    // Valider les données
    if (!date) {
      return NextResponse.json(
        { error: "La date est requise" },
        { status: 400 }
      )
    }

    // Créer l'entrée
    const entry = await prisma.habitEntry.create({
      data: {
        date: new Date(date),
        completed: completed || false,
        note: note || null,
        habitId: params.id,
      },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Erreur lors de la création de l'entrée:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
} 