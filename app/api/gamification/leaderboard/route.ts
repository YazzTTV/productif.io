import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { GamificationService } from "@/services/gamification"

export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeUserRank = searchParams.get('includeUserRank') === 'true'

    const gamificationService = new GamificationService()
    const leaderboard = await gamificationService.getLeaderboard(
      limit, 
      includeUserRank ? user.id : undefined
    )

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error("Erreur lors de la récupération du classement:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du classement" },
      { status: 500 }
    )
  }
} 