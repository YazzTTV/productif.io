import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Augmenter le timeout pour les requêtes complexes (30 secondes)
export const maxDuration = 30

export async function GET() {
  const startTime = Date.now()
  const routeName = "[GAMIFICATION_ACHIEVEMENTS]"
  
  try {
    console.log(`${routeName} ⏱️  DÉBUT - Route: /api/gamification/achievements - Timestamp: ${new Date().toISOString()}`)
    
    const user = await getAuthUser()
    if (!user) {
      console.log(`${routeName} ❌ ERREUR - Non authentifié après ${Date.now() - startTime}ms`)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log(`${routeName} ✅ Utilisateur authentifié: ${user.id} - Temps: ${Date.now() - startTime}ms`)

    // Récupérer tous les achievements
    const dbStartTime = Date.now()
    const allAchievements = await prisma.achievement.findMany({
      orderBy: [
        { type: 'asc' },
        { points: 'asc' }
      ]
    })
    console.log(`${routeName} 📊 Tous les achievements récupérés: ${allAchievements.length} - Temps DB: ${Date.now() - dbStartTime}ms`)

    // Récupérer les achievements débloqués par l'utilisateur
    const userDbStartTime = Date.now()
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: {
        achievement: true
      }
    })
    console.log(`${routeName} 🏆 Achievements utilisateur récupérés: ${userAchievements.length} - Temps DB: ${Date.now() - userDbStartTime}ms`)

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId))

    // Combiner les données
    const processStartTime = Date.now()
    const achievementsWithStatus = allAchievements.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id)
      
      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        type: achievement.type,
        points: achievement.points,
        threshold: achievement.threshold,
        unlocked: unlockedIds.has(achievement.id),
        unlockedAt: userAchievement?.unlockedAt || null
      }
    })

    // Grouper par type
    const groupedAchievements = achievementsWithStatus.reduce((acc, achievement) => {
      if (!acc[achievement.type]) {
        acc[achievement.type] = []
      }
      acc[achievement.type].push(achievement)
      return acc
    }, {} as Record<string, typeof achievementsWithStatus>)
    console.log(`${routeName} ⚙️  Traitement des données terminé en ${Date.now() - processStartTime}ms`)

    const totalTime = Date.now() - startTime
    console.log(`${routeName} ✅ SUCCÈS - Route terminée en ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)

    return NextResponse.json({
      achievements: achievementsWithStatus,
      grouped: groupedAchievements,
      totalUnlocked: userAchievements.length,
      totalAvailable: allAchievements.length
    })
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`${routeName} ❌ ERREUR - Route échouée après ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)
    console.error("Erreur lors de la récupération des achievements:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des achievements" },
      { status: 500 }
    )
  }
} 