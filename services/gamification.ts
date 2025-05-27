import { prisma } from "@/lib/prisma"
import { startOfDay, subDays, isAfter, isBefore, differenceInDays } from "date-fns"

export interface GamificationStats {
  totalPoints: number
  level: number
  currentStreak: number
  longestStreak: number
  totalHabitsCompleted: number
  pointsToNextLevel: number
  recentAchievements: Achievement[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  points: number
  unlockedAt?: Date
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
          totalPoints: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          totalHabitsCompleted: 0
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

    // Bonus jour parfait
    const isPerfectDay = todayHabits.length > 0 && completedTodayHabits.length === todayHabits.length
    if (isPerfectDay) {
      pointsEarned += GamificationService.POINTS.PERFECT_DAY_BONUS
    }

    // Calculer le nouveau total de points et niveau
    const newTotalPoints = userGamification.totalPoints + pointsEarned
    const oldLevel = userGamification.level
    const newLevel = this.calculateLevel(newTotalPoints)
    const levelUp = newLevel > oldLevel

    // Mettre à jour les données de gamification
    await prisma.userGamification.update({
      where: { userId },
      data: {
        totalPoints: newTotalPoints,
        level: newLevel,
        currentStreak: newStreak,
        longestStreak: Math.max(userGamification.longestStreak, newStreak),
        totalHabitsCompleted: userGamification.totalHabitsCompleted + 1
      }
    })

    // Enregistrer l'historique du streak
    await this.recordStreakHistory(userId, normalizedDate, newStreak, completedTodayHabits.length, todayHabits.length)

    // Vérifier les nouveaux achievements
    const achievements = await this.checkAchievements(userId, {
      streak: newStreak,
      oldStreak,
      totalPoints: newTotalPoints,
      totalHabitsCompleted: userGamification.totalHabitsCompleted + 1,
      levelUp,
      perfectDay: isPerfectDay
    })

    return {
      pointsEarned,
      newAchievements: achievements,
      levelUp
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

  // Enregistrer l'historique du streak
  private async recordStreakHistory(userId: string, date: Date, streakCount: number, habitsCompleted: number, totalHabitsForDay: number) {
    await prisma.streakHistory.upsert({
      where: {
        userId_date: {
          userId,
          date: date
        }
      },
      update: {
        streakCount,
        habitsCompleted,
        totalHabitsForDay
      },
      create: {
        userId,
        date: date,
        streakCount,
        habitsCompleted,
        totalHabitsForDay
      }
    })
  }

  // Vérifier et débloquer les achievements
  private async checkAchievements(userId: string, context: {
    streak: number
    oldStreak: number
    totalPoints: number
    totalHabitsCompleted: number
    levelUp: boolean
    perfectDay: boolean
  }): Promise<Achievement[]> {
    const newAchievements: Achievement[] = []

    // Récupérer tous les achievements disponibles
    const allAchievements = await prisma.achievement.findMany()

    // Récupérer les achievements déjà débloqués
    const unlockedAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true }
    })

    const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId))

    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue

      const condition = JSON.parse(achievement.condition)
      let shouldUnlock = false

      // Vérifier les conditions selon la catégorie
      switch (achievement.category) {
        case 'streak':
          shouldUnlock = context.streak >= (condition.streakDays || 0)
          break
        case 'completion':
          shouldUnlock = context.totalHabitsCompleted >= (condition.totalHabits || 0)
          break
        case 'consistency':
          shouldUnlock = context.perfectDay && (condition.perfectDay || false)
          break
        case 'milestone':
          shouldUnlock = context.totalPoints >= (condition.totalPoints || 0)
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
          icon: achievement.icon,
          category: achievement.category,
          rarity: achievement.rarity,
          points: achievement.points,
          unlockedAt: new Date()
        })

        // Ajouter les points de l'achievement
        await prisma.userGamification.update({
          where: { userId },
          data: {
            totalPoints: {
              increment: achievement.points
            }
          }
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
        achievements: {
          include: {
            achievement: true
          },
          orderBy: {
            unlockedAt: 'desc'
          },
          take: 5
        }
      }
    })

    if (!userGamification) {
      throw new Error("Impossible de récupérer les données de gamification")
    }

    // Recalculer le streak actuel pour s'assurer qu'il est à jour
    const currentStreak = await this.calculateCurrentStreak(userId)

    // Mettre à jour le streak si nécessaire
    if (currentStreak !== userGamification.currentStreak) {
      await prisma.userGamification.update({
        where: { userId },
        data: {
          currentStreak,
          longestStreak: Math.max(userGamification.longestStreak, currentStreak)
        }
      })
    }

    const pointsToNextLevel = this.calculatePointsToNextLevel(userGamification.totalPoints)

    const recentAchievements = userGamification.achievements.map(ua => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      category: ua.achievement.category,
      rarity: ua.achievement.rarity,
      points: ua.achievement.points,
      unlockedAt: ua.unlockedAt
    }))

    return {
      totalPoints: userGamification.totalPoints,
      level: userGamification.level,
      currentStreak,
      longestStreak: Math.max(userGamification.longestStreak, currentStreak),
      totalHabitsCompleted: userGamification.totalHabitsCompleted,
      pointsToNextLevel,
      recentAchievements
    }
  }
} 