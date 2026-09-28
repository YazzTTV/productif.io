import { prisma } from "@/lib/prisma"
import { displayName } from "@/lib/community"
import { formatInTimeZone } from "date-fns-tz"
import { validTimezone } from "@/lib/study-analysis/validation"

// Décale une date "yyyy-MM-dd" d'un nombre de jours, sans fuseau.
function shiftDayKey(key: string, days: number): string {
  const d = new Date(`${key}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
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

  // Série : fenêtre de lecture, et durée minimale d'une séance qui compte.
  private static readonly STREAK_WINDOW_DAYS = 120
  private static readonly MIN_STUDY_SECONDS = 5 * 60

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

  // ─── Série (streak) ───────────────────────────────────────────────────────
  // Une journée compte dès qu'il s'y passe une révision réelle : une séance
  // Mode Examen ou Focus d'au moins 5 minutes, une tâche terminée, ou une
  // habitude cochée. Les jours sont ceux du FUSEAU de l'utilisateur (repli
  // Europe/Paris) : avant, c'était l'heure du serveur, en UTC, et la série ne
  // portait que sur les habitudes, un reste de la version entrepreneurs.
  // Aujourd'hui sans activité ne casse pas la série : on part d'hier.
  async calculateCurrentStreak(userId: string, now: Date = new Date()): Promise<number> {
    const since = subDays(now, GamificationService.STREAK_WINDOW_DAYS)
    const [user, sessions, tasks, habits] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
      prisma.studySession.findMany({
        where: { userId, source: { in: ["exam", "focus"] }, startedAt: { gte: since } },
        select: { startedAt: true, segments: true },
      }),
      prisma.task.findMany({
        where: { userId, completed: true, completedAt: { gte: since } },
        select: { completedAt: true },
      }),
      prisma.habitEntry.findMany({
        where: { habit: { userId }, completed: true, date: { gte: since } },
        select: { date: true },
      }),
    ])
    let timezone = "Europe/Paris"
    try {
      timezone = validTimezone(user?.timezone || "Europe/Paris")
    } catch {
      // Fuseau enregistré invalide : repli sur Paris.
    }
    const dayKey = (d: Date) => formatInTimeZone(d, timezone, "yyyy-MM-dd")

    const active = new Set<string>()
    for (const s of sessions) {
      const segments = Array.isArray(s.segments) ? (s.segments as { start: number; end: number }[]) : []
      const seconds = segments.reduce((n, x) => n + Math.max(0, x.end - x.start), 0) / 1000
      if (seconds >= GamificationService.MIN_STUDY_SECONDS) active.add(dayKey(s.startedAt))
    }
    for (const t of tasks) if (t.completedAt) active.add(dayKey(t.completedAt))
    // Les entrées d'habitude sont stockées à midi de leur jour : la date seule suffit.
    for (const h of habits) active.add(h.date.toISOString().slice(0, 10))

    let cursor = dayKey(now)
    if (!active.has(cursor)) cursor = shiftDayKey(cursor, -1)
    let streak = 0
    while (active.has(cursor) && streak < GamificationService.STREAK_WINDOW_DAYS) {
      streak++
      cursor = shiftDayKey(cursor, -1)
    }
    return streak
  }

  // ─── Attribution des points ───────────────────────────────────────────────
  // Toute attribution passe par ici. `key` identifie l'action (une tâche, une
  // séance, une habitude un jour donné) et sert d'identifiant à la ligne
  // XpEvent : la même action ne rapporte donc qu'UNE fois, même rejouée.
  // Avant, cocher/décocher une tâche, renvoyer une habitude déjà cochée ou
  // terminer deux fois une séance Focus redonnait des points à chaque fois.
  private async award(
    userId: string,
    key: string,
    type: string,
    pointsEarned: number,
    options: { date?: Date; perfectDay?: boolean; metadata?: Record<string, unknown> } = {},
  ): Promise<{ pointsEarned: number; newAchievements: Achievement[]; levelUp: boolean }> {
    const none = { pointsEarned: 0, newAchievements: [] as Achievement[], levelUp: false }
    if (pointsEarned <= 0) return none

    await this.initializeUserGamification(userId)
    try {
      await prisma.xpEvent.create({
        data: { id: key, userId, type, xpAwarded: pointsEarned, metadata: (options.metadata ?? {}) as object },
      })
    } catch (error: any) {
      if (error?.code === "P2002") return none // déjà récompensée
      throw error
    }

    const date = options.date ?? new Date()
    const [current, streak] = await Promise.all([
      prisma.userGamification.findUnique({ where: { userId } }),
      this.calculateCurrentStreak(userId, date),
    ])
    if (!current) throw new Error("Impossible de récupérer les données de gamification")

    // Incrément atomique : deux actions simultanées ne s'écrasent pas.
    const updated = await prisma.userGamification.update({
      where: { userId },
      data: {
        points: { increment: pointsEarned },
        currentStreak: streak,
        longestStreak: Math.max(current.longestStreak, streak),
        lastActivityDate: date,
        ...(type === "habit" ? { totalHabitsCompleted: { increment: 1 } } : {}),
      },
    })

    const newAchievements = await this.checkAchievements(userId, {
      streak,
      oldStreak: current.currentStreak,
      points: updated.points,
      levelUp: false,
      perfectDay: !!options.perfectDay,
      habitsCompleted: updated.totalHabitsCompleted,
    })
    const bonus = newAchievements.reduce((total, a) => total + a.points, 0)
    const finalPoints = updated.points + bonus
    const newLevel = this.calculateLevel(finalPoints)
    await prisma.userGamification.update({
      where: { userId },
      data: { level: newLevel, ...(bonus > 0 ? { points: { increment: bonus } } : {}) },
    })

    return { pointsEarned, newAchievements, levelUp: newLevel > current.level }
  }

  // Traiter la complétion d'une habitude (une fois par habitude et par jour)
  async processHabitCompletion(userId: string, habitId: string, date: Date): Promise<{
    pointsEarned: number
    newAchievements: Achievement[]
    levelUp: boolean
  }> {
    const normalizedDate = GamificationService.normalizeDate(date)
    const todayHabits = await this.getTodayHabits(userId, normalizedDate)
    const completedTodayHabits = await this.getCompletedTodayHabits(userId, normalizedDate)
    const isPerfectDay = completedTodayHabits.length === todayHabits.length && todayHabits.length > 0

    let pointsEarned = GamificationService.POINTS.HABIT_COMPLETED
    if (isPerfectDay) pointsEarned += GamificationService.POINTS.PERFECT_DAY_BONUS

    const dayKey = normalizedDate.toISOString().slice(0, 10)
    return this.award(userId, `habit:${habitId}:${dayKey}`, "habit", pointsEarned, {
      perfectDay: isPerfectDay,
      metadata: { habitId, day: dayKey },
    })
  }

  // Traiter la complétion d'une tâche : une seule fois par tâche, même si on
  // la décoche puis la recoche. Sans taskId (ancien appelant), pas de points :
  // rien ne permettrait de dédoublonner.
  async processTaskCompletion(userId: string, date: Date = new Date(), taskId?: string): Promise<{
    pointsEarned: number
    newAchievements: Achievement[]
    levelUp: boolean
  }> {
    if (!taskId) return { pointsEarned: 0, newAchievements: [], levelUp: false }
    return this.award(userId, `task:${taskId}`, "task", GamificationService.POINTS.TASK_COMPLETED, {
      date,
      metadata: { taskId },
    })
  }

  // Séance Focus terminée (route deepwork/agent). Une fois par séance.
  async processDeepWorkCompletion(
    userId: string,
    durationMinutes: number,
    sessionType?: string,
    completedAt: Date = new Date(),
    sessionId?: string,
  ): Promise<{
    pointsEarned: number
    newAchievements: Achievement[]
    levelUp: boolean
  }> {
    if (!sessionId) return { pointsEarned: 0, newAchievements: [], levelUp: false }
    const exam = sessionType === "exam" || sessionType === "exam_mode"
    return this.award(userId, `deepwork:${sessionId}`, "deepwork", this.studyPoints(durationMinutes, exam), {
      date: completedAt,
      metadata: { sessionId, minutes: durationMinutes, sessionType: sessionType ?? null },
    })
  }

  // Séance Mode Examen synchronisée par l'app (route study-analysis/sessions),
  // une fois terminée. Le Focus n'est PAS récompensé ici : il l'est déjà par
  // processDeepWorkCompletion, le compter aussi le paierait deux fois.
  async processStudySession(
    userId: string,
    session: { clientId: string; source: string; endedAt: Date | null; segments: { start: number; end: number }[] },
  ): Promise<{ pointsEarned: number; newAchievements: Achievement[]; levelUp: boolean }> {
    const none = { pointsEarned: 0, newAchievements: [] as Achievement[], levelUp: false }
    if (session.source !== "exam" || !session.endedAt) return none
    const seconds = session.segments.reduce((n, x) => n + Math.max(0, x.end - x.start), 0) / 1000
    if (seconds < GamificationService.MIN_STUDY_SECONDS) return none
    const minutes = Math.floor(seconds / 60)
    return this.award(userId, `study:${userId}:${session.clientId}`, "exam_session", this.studyPoints(minutes, true), {
      date: session.endedAt,
      metadata: { clientId: session.clientId, minutes },
    })
  }

  // 1 point par tranche de 5 minutes, x1,5 en Mode Examen : 25 min = 8 points,
  // plus qu'une tâche cochée (5), parce que c'est le cœur du produit.
  private studyPoints(minutes: number, exam: boolean): number {
    if (minutes <= 0) return 0
    const raw = minutes * GamificationService.POINTS.DEEPWORK_POINTS_PER_MINUTE * (exam ? 1.5 : 1)
    return Math.max(1, Math.round(raw))
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
    habitsCompleted?: number
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
        // Ces deux types existent en base depuis le début (7 succès sur 12) et
        // n'étaient traités nulle part : ils ne se débloquaient jamais.
        case 'points':
          shouldUnlock = context.points >= achievement.threshold
          break
        case 'habits':
          shouldUnlock = (context.habitsCompleted ?? 0) >= achievement.threshold
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
            name: true
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
      // Jamais d'email dans un classement : il part vers d'autres utilisateurs.
      userName: displayName(userGamif.user.name),
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
