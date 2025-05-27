import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { GamificationService } from "@/services/gamification"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const gamificationService = new GamificationService()
    const stats = await gamificationService.getUserStats(user.id)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Erreur lors de la récupération des stats de gamification:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
} 