import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const user = await getAuthUser()

    if (!user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    // Utiliser une requête SQL directe pour récupérer toutes les entrées avec les notes et évaluations
    const entries = await prisma.$queryRaw`
      SELECT 
        he.id, 
        he."habitId", 
        he.date, 
        he.completed, 
        he.note, 
        he.rating, 
        he."createdAt", 
        he."updatedAt",
        h.id as "habit_id", 
        h.name as "habit_name", 
        h.color as "habit_color"
      FROM "habit_entries" he
      JOIN "habits" h ON he."habitId" = h.id
      WHERE h."userId" = ${user.id}
      AND (he.note IS NOT NULL OR he.rating IS NOT NULL)
      ORDER BY he.date DESC
    `;

    // Transformer les résultats pour correspondre à la structure attendue
    const formattedEntries = (entries as any[]).map(entry => ({
      id: entry.id,
      habitId: entry.habitId,
      date: entry.date,
      completed: entry.completed,
      note: entry.note,
      rating: entry.rating,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      habit: {
        id: entry.habit_id,
        name: entry.habit_name,
        color: entry.habit_color
      }
    }));

    return NextResponse.json(formattedEntries)
  } catch (error) {
    console.error("Erreur lors de la récupération des entrées:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 