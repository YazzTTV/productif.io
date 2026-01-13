import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { GamificationService } from "@/services/gamification"
import { getPlanInfo, buildLockedFeature } from "@/lib/plans"

// Augmenter le timeout pour les requêtes complexes (30 secondes)
export const maxDuration = 30

export async function GET(request: Request) {
  const startTime = Date.now()
  const routeName = "[GAMIFICATION_LEADERBOARD]"
  
  try {
    console.log(`${routeName} ⏱️  DÉBUT - Route: /api/gamification/leaderboard - Timestamp: ${new Date().toISOString()}`)
    
    const user = await getAuthUser()
    if (!user) {
      console.log(`${routeName} ❌ ERREUR - Non authentifié après ${Date.now() - startTime}ms`)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log(`${routeName} ✅ Utilisateur authentifié: ${user.id} - Temps: ${Date.now() - startTime}ms`)

    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeUserRank = searchParams.get('includeUserRank') === 'true'

    console.log(`${routeName} 📊 Paramètres - limit: ${limit}, includeUserRank: ${includeUserRank}`)

    const planInfo = getPlanInfo(user)
    if (!planInfo.limits.allowGlobalLeaderboard) {
      return NextResponse.json(
        {
          error: "Le classement global est réservé au plan Premium",
          ...buildLockedFeature("leaderboard_global"),
          plan: planInfo.plan,
          planLimits: planInfo.limits,
        },
        { status: 403 }
      )
    }

    const serviceStartTime = Date.now()
    const gamificationService = new GamificationService()
    const leaderboard = await gamificationService.getLeaderboard(
      limit, 
      includeUserRank ? user.id : undefined
    )
    console.log(`${routeName} ⚙️  Service getLeaderboard terminé en ${Date.now() - serviceStartTime}ms`)

    const totalTime = Date.now() - startTime
    console.log(`${routeName} ✅ SUCCÈS - Route terminée en ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)

    return NextResponse.json(leaderboard)
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`${routeName} ❌ ERREUR - Route échouée après ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)
    console.error("Erreur lors de la récupération du classement:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du classement" },
      { status: 500 }
    )
  }
} 
