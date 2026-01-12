import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer les groupes de l'utilisateur
    const userGroups = await prisma.leaderboardGroupMember.findMany({
      where: { userId: user.id },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  include: {
                    gamification: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Récupérer tous les utilisateurs des groupes de l'utilisateur (amis)
    const friendUserIds = new Set<string>()
    userGroups.forEach(ug => {
      if (ug.group && ug.group.members) {
        ug.group.members.forEach(member => {
          if (member.userId !== user.id) {
            friendUserIds.add(member.userId)
          }
        })
      }
    })

    // Récupérer les données de gamification des amis
    const friendsData = friendUserIds.size > 0 
      ? await prisma.userGamification.findMany({
          where: {
            userId: { in: Array.from(friendUserIds) }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      : []

    // Calculer les sessions de focus de la semaine pour chaque utilisateur
    const since = new Date()
    since.setDate(since.getDate() - 7)

    const allUserIds = Array.from(friendUserIds).concat([user.id])
    const focusSessionsCount = allUserIds.length > 0
      ? await prisma.deepWorkSession.groupBy({
          by: ['userId'],
          where: {
            createdAt: { gte: since },
            userId: { in: allUserIds }
          },
          _count: {
            id: true
          }
        })
      : []

    const sessionsMap = new Map(
      focusSessionsCount.map(s => [s.userId, s._count.id])
    )

    // Formater les données des amis
    const friends = friendsData
      .map(friendGamif => {
        return {
          id: friendGamif.userId,
          name: friendGamif.user.name || friendGamif.user.email.split('@')[0],
          email: friendGamif.user.email,
          xp: friendGamif.totalXp || 0,
          maxXP: friendGamif.nextLevelXp || 3000,
          streak: friendGamif.currentStreak || 0,
          focusSessions: sessionsMap.get(friendGamif.userId) || 0,
          rank: 0 // Sera calculé après tri
        }
      })
      .sort((a, b) => {
        if (b.xp !== a.xp) return b.xp - a.xp
        if (b.streak !== a.streak) return b.streak - a.streak
        return b.focusSessions - a.focusSessions
      })
      .map((friend, index) => ({
        ...friend,
        rank: index + 1
      }))

    // Récupérer les données de l'utilisateur actuel
    const userGamification = await prisma.userGamification.findUnique({
      where: { userId: user.id }
    })

    const userFocusSessions = sessionsMap.get(user.id) || 0

    const currentUser = {
      id: user.id,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      xp: userGamification?.totalXp || 0,
      maxXP: userGamification?.nextLevelXp || 3000,
      streak: userGamification?.currentStreak || 0,
      focusSessions: userFocusSessions,
      rank: 0
    }

    // Insérer l'utilisateur actuel dans la liste des amis avec son rang
    const allFriends = [...friends]
    if (!allFriends.find(f => f.id === user.id)) {
      allFriends.push(currentUser)
    }
    allFriends.sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp
      if (b.streak !== a.streak) return b.streak - a.streak
      return b.focusSessions - a.focusSessions
    })
    allFriends.forEach((f, index) => {
      f.rank = index + 1
    })

    const userRankInFriends = allFriends.findIndex(f => f.id === user.id) + 1
    const userRankInClass = classData.findIndex(u => u.id === user.id) + 1

    // Récupérer les données du groupe principal (premier groupe ou créer un groupe par défaut)
    let classData: typeof friends = []
    if (userGroups.length > 0 && userGroups[0].group && userGroups[0].group.members) {
      const mainGroup = userGroups[0].group
      const classMembers = mainGroup.members
        .map(member => {
          if (!member.user || !member.user.gamification) return null
          const gamif = member.user.gamification

          return {
            id: member.user.id,
            name: member.user.name || member.user.email.split('@')[0],
            email: member.user.email,
            xp: gamif.totalXp || 0,
            maxXP: gamif.nextLevelXp || 3000,
            streak: gamif.currentStreak || 0,
            focusSessions: sessionsMap.get(member.user.id) || 0,
            rank: 0
          }
        })
        .filter((m): m is NonNullable<typeof m> => m !== null)
        .sort((a, b) => {
          if (b.xp !== a.xp) return b.xp - a.xp
          if (b.streak !== a.streak) return b.streak - a.streak
          return b.focusSessions - a.focusSessions
        })
        .map((member, index) => ({
          ...member,
          rank: index + 1
        }))

      classData = classMembers
    } else {
      // Si pas de groupe, utiliser les amis comme groupe
      classData = allFriends
    }

    // Récupérer le leaderboard global (top 50)
    const globalLeaderboard = await prisma.userGamification.findMany({
      orderBy: { totalXp: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    const globalData = globalLeaderboard
      .map((entry, index) => {
        return {
          id: entry.userId,
          name: entry.user.name || entry.user.email.split('@')[0],
          email: entry.user.email,
          xp: entry.totalXp || 0,
          maxXP: entry.nextLevelXp || 3000,
          streak: entry.currentStreak || 0,
          focusSessions: sessionsMap.get(entry.userId) || 0,
          rank: index + 1
        }
      })

    const userRankInGlobal = globalData.findIndex(u => u.id === user.id) + 1

    return NextResponse.json({
      friends: allFriends,
      class: classData,
      global: globalData,
      userRank: {
        friends: userRankInFriends > 0 ? userRankInFriends : undefined,
        class: userRankInClass > 0 ? userRankInClass : undefined,
        global: userRankInGlobal > 0 ? userRankInGlobal : undefined
      },
      currentUser: {
        ...currentUser,
        rank: {
          friends: userRankInFriends > 0 ? userRankInFriends : undefined,
          class: userRankInClass > 0 ? userRankInClass : undefined,
          global: userRankInGlobal > 0 ? userRankInGlobal : undefined
        }
      }
    })
  } catch (error) {
    console.error("Erreur lors de la récupération du leaderboard:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du leaderboard" },
      { status: 500 }
    )
  }
}

