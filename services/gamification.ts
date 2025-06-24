import { prisma } from "@/lib/prisma"
import { startOfDay, subDays, isAfter, isBefore, differenceInDays } from "date-fns"

export interface GamificationStats {
  points: number
  level: number
  currentStreak: number
  longestStreak: number
  pointsToNextLevel: number
  recentAchievements: Achievement[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  type: string
  threshold: number
  points: number
  unlockedAt?: Date
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  userEmail: string
  points: number
  level: number
  currentStreak: number
  longestStreak: number
  rank: number
}

export class GamificationService {
  // Points accordés par action
  private static readonly POINTS = {
    HABIT_COMPLETED: 10,
    STREAK_BONUS_MULTIPLIER: 0.1, // 10% de bonus par jour de streak
    PERFECT_DAY_BONUS: 20,
    ACHIEVEMENT_BONUS: 50
  }

  // Formule pour calculer le niveau basé sur les points
  private static readonly LEVEL_FORMULA = {
    BASE_POINTS: 100,
    MULTIPLIER: 1.5
  }

  // Obtenir la date du jour comme le frontend (midi UTC)
  static getTodayAsStored(): Date {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    today.setHours(12, 0, 0, 0) // Même logique que le frontend
    return today
  }

  // Normaliser une date comme le frontend (midi UTC)
  static normalizeDate(date: Date): Date {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    normalized.setHours(12, 0, 0, 0) // Même logique que le frontend
    return normalized
  }

  // Initialiser la gamification pour un utilisateur
  async initializeUserGamification(userId: string) {
    const existing = await prisma.userGamification.findUnique({
      where: { userId }
    })

    if (!existing) {
      await prisma.userGamification.create({
        data: {
          userId,
          points: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0
        }
      })
    }
  }

  // Calculer le niveau basé sur les points
  private calculateLevel(points: number): number {
    const { BASE_POINTS, MULTIPLIER } = GamificationService.LEVEL_FORMULA
    return Math.floor(Math.log(points / BASE_POINTS + 1) / Math.log(MULTIPLIER)) + 1
  }

  // Calculer les points nécessaires pour le niveau suivant
  private calculatePointsToNextLevel(currentPoints: number): number {
    const currentLevel = this.calculateLevel(currentPoints)
    const { BASE_POINTS, MULTIPLIER } = GamificationService.LEVEL_FORMULA
    const nextLevelPoints = Math.floor(BASE_POINTS * (Math.pow(MULTIPLIER, currentLevel) - 1))
    return Math.max(0, nextLevelPoints - currentPoints)
  }

  // Calculer le streak actuel d'un utilisateur
  async calculateCurrentStreak(userId: string): Promise<number> {
    const today = GamificationService.getTodayAsStored()
    let streak = 0
    let checkDate = today

    console.log(`🧮 Calcul du streak - Date de référence: ${checkDate.toISOString()}`)

    // Vérifier jour par jour en remontant dans le temps
    while (true) {
      const dayName = checkDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      
      console.log(`📅 Vérification du ${checkDate.toISOString().split('T')[0]} (${dayName})`)
      
      const dayHabits = await prisma.habit.findMany({
        where: {
          userId,
          daysOfWeek: {
            has: dayName
          }
        },
        include: {
          entries: {
            where: {
              date: checkDate,
              completed: true
            }
          }
        }
      })

      console.log(`  - Habitudes prévues: ${dayHabits.length}`)

      // Si aucune habitude prévue ce jour, on passe au jour précédent
      if (dayHabits.length === 0) {
        console.log(`  - Aucune habitude prévue, on continue...`)
        checkDate = subDays(checkDate, 1)
        continue
      }

      // Vérifier si toutes les habitudes du jour ont été complétées
      const completedHabits = dayHabits.filter(habit => habit.entries.length > 0)
      console.log(`  - Habitudes complétées: ${completedHabits.length}`)
      
      if (completedHabits.length === dayHabits.length) {
        streak++
        console.log(`  - ✅ Jour parfait ! Streak = ${streak}`)
        checkDate = subDays(checkDate, 1)
      } else {
        console.log(`  - ❌ Jour incomplet. Streak s'arrête.`)
        break
      }

      // Limite de sécurité pour éviter les boucles infinies
      if (streak > 365) {
        console.log('⚠️  Limite de sécurité atteinte (365 jours)')
        break
      }
    }

    console.log(`🎯 Streak final calculé: ${streak}`)
    return streak
  }

  // Traiter la complétion d'une habitude
  async processHabitCompletion(userId: string, habitId: string, date: Date): Promise<{
    pointsEarned: number
    newAchievements: Achievement[]
    levelUp: boolean
  }> {
    await this.initializeUserGamification(userId)

    // Normaliser la date comme le frontend
    const normalizedDate = GamificationService.normalizeDate(date)

    // Récupérer les données actuelles de gamification
    const userGamification = await prisma.userGamification.findUnique({
      where: { userId }
    })

    if (!userGamification) {
      throw new Error("Impossible de récupérer les données de gamification")
    }

    // Calculer les habitudes du jour et celles complétées
    const todayHabits = await this.getTodayHabits(userId, normalizedDate)
    const completedTodayHabits = await this.getCompletedTodayHabits(userId, normalizedDate)

    // Calculer le nouveau streak
    const oldStreak = userGamification.currentStreak
    const newStreak = await this.calculateCurrentStreak(userId)

    // Calculer les points
    let pointsEarned = GamificationService.POINTS.HABIT_COMPLETED

    // Bonus de streak (10% par jour de streak)
    if (newStreak > 0) {
      pointsEarned += Math.floor(pointsEarned * GamificationService.POINTS.STREAK_BONUS_MULTIPLIER * newStreak)
    }

    // Bonus de jour parfait
    const isPerfectDay = completedTodayHabits.length === todayHabits.length && todayHabits.length > 0
    if (isPerfectDay) {
      pointsEarned += GamificationService.POINTS.PERFECT_DAY_BONUS
    }

    // Calculer le nouveau total de points et niveau
    const newPoints = userGamification.points + pointsEarned
    const oldLevel = userGamification.level
    const newLevel = this.calculateLevel(newPoints)

    // Mettre à jour les données de gamification
    await prisma.userGamification.update({
      where: { userId },
      data: {
        points: newPoints,
        level: newLevel,
        currentStreak: newStreak,
        longestStreak: Math.max(userGamification.longestStreak, newStreak),
        lastActivityDate: new Date()
      }
    })

    // Vérifier les nouveaux succès
    const newAchievements = await this.checkAchievements(userId, {
      streak: newStreak,
      oldStreak,
      points: newPoints,
      levelUp: newLevel > oldLevel,
      perfectDay: isPerfectDay
    })

    // Ajouter les points des succès
    if (newAchievements.length > 0) {
      const achievementPoints = newAchievements.reduce((total, achievement) => total + achievement.points, 0)
      await prisma.userGamification.update({
        where: { userId },
        data: {
          points: {
            increment: achievementPoints
          }
        }
      })
    }

    return {
      pointsEarned,
      newAchievements,
      levelUp: newLevel > oldLevel
    }
  }

  // Obtenir les habitudes du jour
  private async getTodayHabits(userId: string, date: Date) {
    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
    
    return await prisma.habit.findMany({
      where: {
        userId,
        daysOfWeek: {
          has: dayOfWeek
        }
      }
    })
  }

  // Obtenir les habitudes complétées aujourd'hui
  private async getCompletedTodayHabits(userId: string, date: Date) {
    return await prisma.habitEntry.findMany({
      where: {
        habit: {
          userId
        },
        date: date,
        completed: true
      },
      include: {
        habit: true
      }
    })
  }

  // Vérifier et débloquer les achievements
  private async checkAchievements(userId: string, context: {
    streak: number
    oldStreak: number
    points: number
    levelUp: boolean
    perfectDay: boolean
  }): Promise<Achievement[]> {
    const achievements = await prisma.achievement.findMany()
    const newAchievements: Achievement[] = []

    for (const achievement of achievements) {
      // Vérifier si l'achievement est déjà débloqué
      const alreadyUnlocked = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id
          }
        }
      })

      if (alreadyUnlocked) {
        continue
      }

      // Vérifier si l'achievement doit être débloqué
      let shouldUnlock = false

      switch (achievement.type) {
        case 'streak':
          shouldUnlock = context.streak >= achievement.threshold
          break
        case 'level':
          shouldUnlock = context.levelUp && context.points >= achievement.threshold
          break
        case 'perfect_day':
          shouldUnlock = context.perfectDay
          break
      }

      if (shouldUnlock) {
        // Débloquer l'achievement
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id
          }
        })

        newAchievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          type: achievement.type,
          threshold: achievement.threshold,
          points: achievement.points,
          unlockedAt: new Date()
        })
      }
    }

    return newAchievements
  }

  // Obtenir les statistiques de gamification d'un utilisateur
  async getUserStats(userId: string): Promise<GamificationStats> {
    await this.initializeUserGamification(userId)

    const userGamification = await prisma.userGamification.findUnique({
      where: { userId },
      include: {
        user: true
      }
    })

    if (!userGamification) {
      throw new Error("Impossible de récupérer les données de gamification")
    }

    const currentStreak = await this.calculateCurrentStreak(userId)
    const pointsToNextLevel = this.calculatePointsToNextLevel(userGamification.points)

    return {
      points: userGamification.points,
      level: userGamification.level,
      currentStreak,
      longestStreak: userGamification.longestStreak,
      pointsToNextLevel,
      recentAchievements: []
    }
  }

  // Obtenir le classement
  async getLeaderboard(limit: number = 50, userId?: string): Promise<{
    leaderboard: LeaderboardEntry[]
    userRank?: number
    totalUsers: number
  }> {
    const allUserGamification = await prisma.userGamification.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { points: 'desc' },
        { level: 'desc' },
        { longestStreak: 'desc' }
      ]
    })

    const leaderboard: LeaderboardEntry[] = allUserGamification.map((userGamif, index) => ({
      userId: userGamif.userId,
      userName: userGamif.user.name || userGamif.user.email.split('@')[0],
      userEmail: userGamif.user.email,
      points: userGamif.points,
      level: userGamif.level,
      currentStreak: userGamif.currentStreak,
      longestStreak: userGamif.longestStreak,
      rank: index + 1
    }))

    const userRank = userId
      ? leaderboard.findIndex(entry => entry.userId === userId) + 1
      : undefined

    return {
      leaderboard: leaderboard.slice(0, limit),
      userRank,
      totalUsers: leaderboard.length
    }
  }
} 