import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { id: groupId } = await params

    // Vérifier que l'utilisateur est membre du groupe
    const membership = await prisma.leaderboardGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre de ce groupe" },
        { status: 403 }
      )
    }

    // Récupérer tous les membres du groupe
    const members = await prisma.leaderboardGroupMember.findMany({
      where: { groupId },
      include: {
        user: {
          include: {
            gamification: true
          }
        }
      }
    })

    // Construire le leaderboard avec les données de gamification
    type LeaderboardEntry = {
      userId: string
      userName: string
      userEmail: string
      points: number
      level: number
      currentStreak: number
      longestStreak: number
      rank: number
    }

    const leaderboard: LeaderboardEntry[] = members
      .map(member => {
        const gamif = member.user.gamification
        if (!gamif) return null

        return {
          userId: member.user.id,
          userName: member.user.name || member.user.email.split('@')[0],
          userEmail: member.user.email,
          points: gamif.points,
          level: gamif.level,
          currentStreak: gamif.currentStreak,
          longestStreak: gamif.longestStreak,
          rank: 0 // Sera calculé après tri
        }
      })
      .filter((entry): entry is LeaderboardEntry => entry !== null)
      .sort((a, b) => {
        // Trier par points, puis niveau, puis streak
        if (b.points !== a.points) return b.points - a.points
        if (b.level !== a.level) return b.level - a.level
        return b.longestStreak - a.longestStreak
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))

    // Trouver le rang de l'utilisateur
    const userRank = leaderboard.findIndex(
      entry => entry.userId === user.id
    ) + 1

    return NextResponse.json({
      leaderboard,
      userRank: userRank > 0 ? userRank : undefined,
      totalUsers: leaderboard.length
    })
  } catch (error) {
    console.error("Erreur lors de la récupération du leaderboard du groupe:", error)
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error("Détails de l'erreur:", { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération du leaderboard",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

