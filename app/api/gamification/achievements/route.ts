import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer tous les achievements
    const allAchievements = await prisma.achievement.findMany({
      orderBy: [
        { type: 'asc' },
        { points: 'asc' }
      ]
    })

    // Récupérer les achievements débloqués par l'utilisateur
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: {
        achievement: true
      }
    })

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId))

    // Combiner les données
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

    return NextResponse.json({
      achievements: achievementsWithStatus,
      grouped: groupedAchievements,
      totalUnlocked: userAchievements.length,
      totalAvailable: allAchievements.length
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des achievements:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des achievements" },
      { status: 500 }
    )
  }
} 