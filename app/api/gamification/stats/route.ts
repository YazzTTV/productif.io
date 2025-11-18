import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { GamificationService } from "@/services/gamification"

// Augmenter le timeout pour les requêtes complexes (30 secondes)
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const routeName = "[GAMIFICATION_STATS]"
  
  try {
    console.log(`${routeName} ⏱️  DÉBUT - Route: /api/gamification/stats - Timestamp: ${new Date().toISOString()}`)
    
    // Utiliser getAuthUserFromRequest pour gérer à la fois les cookies (web) et les headers (mobile)
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      console.log(`${routeName} ❌ ERREUR - Non authentifié après ${Date.now() - startTime}ms`)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log(`${routeName} ✅ Utilisateur authentifié: ${user.id} - Temps: ${Date.now() - startTime}ms`)
    console.log(`${routeName} 📊 Récupération des stats pour userId: ${user.id}`)

    const serviceStartTime = Date.now()
    const gamificationService = new GamificationService()
    const stats = await gamificationService.getUserStats(user.id)
    console.log(`${routeName} ⚙️  Service getUserStats terminé en ${Date.now() - serviceStartTime}ms`)

    const totalTime = Date.now() - startTime
    console.log(`${routeName} ✅ SUCCÈS - Route terminée en ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)
    console.log(`${routeName} 📊 Stats retournées:`, {
      energyLevel: stats.energyLevel,
      focusLevel: stats.focusLevel,
      stressLevel: stats.stressLevel
    })

    return NextResponse.json(stats)
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`${routeName} ❌ ERREUR - Route échouée après ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)
    console.error("Erreur lors de la récupération des stats de gamification:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
} 