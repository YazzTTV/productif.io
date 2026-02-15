import { prisma } from "@/lib/prisma"
import { startOfDay, subDays, isAfter, isBefore, differenceInDays } from "date-fns"

export interface GamificationStats {
  points: number
  level: number
  currentStreak: number
  longestStreak: number
  pointsToNextLevel: number
  recentAchievements: Achievement[]
  energyLevel?: number
  focusLevel?: number
  stressLevel?: number
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
  totalPoints?: number // Alias pour points (compatibilité)
  level: number
  currentStreak: number
  longestStreak: number
  totalHabitsCompleted?: number
  achievements?: number
  rank: number
}

export class GamificationService {
  // Points accordés par action
  private static readonly POINTS = {
    HABIT_COMPLETED: 10,
    TASK_COMPLETED: 5,
    // 1 point de communauté par tranche de 5 minutes de focus
    DEEPWORK_POINTS_PER_MINUTE: 1 / 5,
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
    // OPTIMISATION: Vérification rapide si l'utilisateur a des habitudes
    const habitCount = await prisma.habit.count({ where: { userId } })
    if (habitCount === 0) {
      console.log(`🧮 Aucune habitude pour userId ${userId}, streak = 0`)
      return 0
    }

    const today = GamificationService.getTodayAsStored()
    let streak = 0
    let checkDate = today

    console.log(`🧮 Calcul du streak - Date de référence: ${checkDate.toISOString()}`)

    // Vérifier jour par jour en remontant dans le temps (limité à 30 jours pour éviter les timeouts)
    let daysChecked = 0
    const maxDaysToCheck = 30
    while (daysChecked < maxDaysToCheck) {
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

      daysChecked++
      
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

  // Traiter la complétion d'une tâche (points simples, sans streak ni "perfect day")
  async processTaskCompletion(userId: string, date: Date = new Date()): Promise<{
    pointsEarned: number
    newAchievements: Achievement[]
    levelUp: boolean
  }> {
    await this.initializeUserGamification(userId)

    const userGamification = await prisma.userGamification.findUnique({
      where: { userId }
    })

    if (!userGamification) {
      throw new Error("Impossible de récupérer les données de gamification")
    }

    // Pour l’instant : points fixes par tâche, sans logique de streak
    let pointsEarned = GamificationService.POINTS.TASK_COMPLETED

    const newPoints = userGamification.points + pointsEarned
    const oldLevel = userGamification.level
    const newLevel = this.calculateLevel(newPoints)

    await prisma.userGamification.update({
      where: { userId },
      data: {
        points: newPoints,
        level: newLevel,
        lastActivityDate: date
      }
    })

    // Vérifier les achievements liés au niveau / points
    const newAchievements = await this.checkAchievements(userId, {
      streak: userGamification.currentStreak,
      oldStreak: userGamification.currentStreak,
      points: newPoints,
      levelUp: newLevel > oldLevel,
      perfectDay: false
    })

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

  // Traiter la complétion d'une session de deep work / focus / examen
  async processDeepWorkCompletion(userId: string, durationMinutes: number, sessionType?: string, completedAt: Date = new Date()): Promise<{
    pointsEarned: number
    newAchievements: Achievement[]
    levelUp: boolean
  }> {
    await this.initializeUserGamification(userId)

    const userGamification = await prisma.userGamification.findUnique({
      where: { userId }
    })

    if (!userGamification) {
      throw new Error("Impossible de récupérer les données de gamification")
    }

    // Base: 1 point par 5 minutes de focus effectif
    let rawPoints = durationMinutes * GamificationService.POINTS.DEEPWORK_POINTS_PER_MINUTE

    // Bonus léger pour les sessions d'examen si un type spécifique est utilisé
    if (sessionType && (sessionType === 'exam' || sessionType === 'exam_mode')) {
      rawPoints *= 1.5
    }

    const pointsEarned = Math.max(1, Math.round(rawPoints))

    const newPoints = userGamification.points + pointsEarned
    const oldLevel = userGamification.level
    const newLevel = this.calculateLevel(newPoints)

    await prisma.userGamification.update({
      where: { userId },
      data: {
        points: newPoints,
        level: newLevel,
        lastActivityDate: completedAt
      }
    })

    // Vérifier les achievements liés au niveau / points
    const newAchievements = await this.checkAchievements(userId, {
      streak: userGamification.currentStreak,
      oldStreak: userGamification.currentStreak,
      points: newPoints,
      levelUp: newLevel > oldLevel,
      perfectDay: false
    })

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

    // Récupérer les derniers check-ins de comportement pour Energy, Focus, Stress
    // Ces données proviennent des réponses de l'utilisateur à l'agent IA tout au long de la journée
    const sevenDaysAgo = subDays(new Date(), 7)
    const recentCheckIns = await prisma.behaviorCheckIn.findMany({
      where: {
        userId,
        type: {
          in: ['energy', 'focus', 'stress']
        },
        timestamp: {
          gte: sevenDaysAgo // Derniers 7 jours
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100 // Augmenter à 100 pour avoir plus de données récentes
    })

    console.log(`[Gamification] Récupération des BehaviorCheckIn pour userId: ${userId}`)
    console.log(`[Gamification] Check-ins trouvés: ${recentCheckIns.length}`)
    console.log(`[Gamification] Période: ${sevenDaysAgo.toISOString()} à maintenant`)

    // Calculer les moyennes des derniers check-ins par type
    // Les valeurs sont sur une échelle de 1-10, on les convertit en 0-100 pour l'affichage
    const energyCheckIns = recentCheckIns.filter(c => c.type === 'energy')
    const focusCheckIns = recentCheckIns.filter(c => c.type === 'focus')
    const stressCheckIns = recentCheckIns.filter(c => c.type === 'stress')

    console.log(`[Gamification] Energy check-ins: ${energyCheckIns.length}`)
    console.log(`[Gamification] Focus check-ins: ${focusCheckIns.length}`)
    console.log(`[Gamification] Stress check-ins: ${stressCheckIns.length}`)

    // Calculer la moyenne et convertir de 1-10 à 0-100
    // Exemple: moyenne de 7.5 → 7.5 * 10 = 75%
    const energyLevel = energyCheckIns.length > 0
      ? Math.round((energyCheckIns.reduce((sum, c) => sum + c.value, 0) / energyCheckIns.length) * 10)
      : undefined

    const focusLevel = focusCheckIns.length > 0
      ? Math.round((focusCheckIns.reduce((sum, c) => sum + c.value, 0) / focusCheckIns.length) * 10)
      : undefined

    const stressLevel = stressCheckIns.length > 0
      ? Math.round((stressCheckIns.reduce((sum, c) => sum + c.value, 0) / stressCheckIns.length) * 10)
      : undefined

    console.log(`[Gamification] Calculs finaux:`, {
      energyLevel,
      focusLevel,
      stressLevel
    })

    // Toujours retourner les champs même s'ils sont undefined pour que le frontend puisse les détecter
    return {
      points: userGamification.points,
      level: userGamification.level,
      currentStreak,
      longestStreak: userGamification.longestStreak,
      pointsToNextLevel,
      recentAchievements: [],
      energyLevel: energyLevel ?? null, // Retourner null au lieu de undefined pour que JSON le sérialise
      focusLevel: focusLevel ?? null,
      stressLevel: stressLevel ?? null
    }
  }

  // Obtenir le classement
  async getLeaderboard(limit: number = 50, userId?: string): Promise<{
    leaderboard: LeaderboardEntry[]
    userRank?: number
    totalUsers: number
  }> {
    // OPTIMISATION: Limiter le nombre d'utilisateurs récupérés
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
      ],
      take: Math.max(limit, 100) // Limiter à max(limit, 100) pour éviter de charger tous les utilisateurs
    })

    const leaderboard: LeaderboardEntry[] = allUserGamification.map((userGamif, index) => ({
      userId: userGamif.userId,
      userName: userGamif.user.name || userGamif.user.email.split('@')[0],
      userEmail: userGamif.user.email,
      points: userGamif.points,
      totalPoints: userGamif.points,
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
