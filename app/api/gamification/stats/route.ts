import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { GamificationService } from "@/services/gamification"

export async function GET(req: NextRequest) {
  try {
    // Utiliser getAuthUserFromRequest pour gérer à la fois les cookies (web) et les headers (mobile)
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log(`[Gamification API] Récupération des stats pour userId: ${user.id}`)

    const gamificationService = new GamificationService()
    const stats = await gamificationService.getUserStats(user.id)

    console.log(`[Gamification API] Stats retournées:`, {
      energyLevel: stats.energyLevel,
      focusLevel: stats.focusLevel,
      stressLevel: stats.stressLevel
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Erreur lors de la récupération des stats de gamification:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
} 