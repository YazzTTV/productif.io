"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { 
  Home, Bot, Settings as SettingsIcon, Plus, TrendingUp, Target, Zap, Clock, 
  Award, Activity, CheckCircle2, Flame, Trophy, Star
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useLocale } from "@/lib/i18n"
import { safeJsonResponse } from "@/lib/api-utils"

interface DashboardData {
  user: {
    name: string
  }
  metrics: {
    todayProgress: number
    focusHours: number
    streakDays: number
    productivityScore: number
    tasksCompleted: number
    totalTasks: number
  }
  weeklyData: Array<{ day: string; score: number }>
  habits: Array<{
    id: string
    name: string
    completed: boolean
    streak: number
    time?: string
  }>
  todayTasks: Array<{
    id: string
    title: string
    completed: boolean
    priority: number
    dueDate?: string
    project?: { name: string }
  }>
  leaderboard: Array<{
    rank: number
    name: string
    score: number
    avatar: string
    isUser: boolean
  }>
  performanceMetrics: {
    totalHours: number
    tasksDone: number
    peakTime: string
    rank: number
  }
}

export function NewDashboard() {
  const router = useRouter()
  const { t } = useLocale()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [habitStates, setHabitStates] = useState<Array<{ id: string; name: string; completed: boolean; streak: number }>>([])
  const [celebratingHabit, setCelebratingHabit] = useState<string | null>(null)
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [recentAchievements, setRecentAchievements] = useState<Array<{
    id: string
    name: string
    description: string
    type: string
    points: number
    threshold: number
    unlocked: boolean
    unlockedAt?: string
  }>>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch all dashboard data in parallel
      const [metricsRes, weeklyRes, habitsRes, leaderboardRes, userRes, todayTasksRes] = await Promise.all([
        fetch("/api/dashboard/metrics"),
        fetch("/api/dashboard/weekly-productivity?period=week"),
        fetch("/api/habits"),
        fetch("/api/gamification/leaderboard?limit=3"),
        fetch("/api/auth/me"),
        fetch("/api/tasks/today")
      ])

      const metrics = await safeJsonResponse(metricsRes, "dashboard/metrics")
      const weekly = await safeJsonResponse(weeklyRes, "dashboard/weekly-productivity")
      const habits = await safeJsonResponse(habitsRes, "habits")
      const leaderboard = await safeJsonResponse(leaderboardRes, "gamification/leaderboard")
      const user = await safeJsonResponse(userRes, "auth/me")
      const todayTasks = await safeJsonResponse(todayTasksRes, "tasks/today")

      // Calculate today's progress - même logique que l'app mobile
      const tasksCompleted = metrics.tasks?.completed || 0
      const totalTasks = metrics.tasks?.today || 0

      // Préparer la date du jour au format AAAA-MM-JJ (comme sur mobile)
      const todayStr = new Date().toISOString().split("T")[0]

      // Normaliser les habitudes comme sur mobile: peut être un tableau brut ou { habits: [...] }
      const habitsList = Array.isArray(habits)
        ? habits
        : Array.isArray(habits?.habits)
          ? habits.habits
          : []

      // Habitudes actives (isActive !== false)
      const activeHabits = habitsList.filter((h: any) => h.isActive !== false)

      // Nombre d'habitudes complétées aujourd'hui (même logique que mobile-app-new)
      const completedHabitsToday = activeHabits.filter((habit: any) => {
        const entries = habit.entries || habit.completions || []
        const todayEntry = entries.find((entry: any) => {
          const entryDate = new Date(entry.date).toISOString().split("T")[0]
          return entryDate === todayStr && entry.completed === true
        })
        return !!todayEntry
      }).length

      // Pourcentages de progression
      const habitsProgress =
        activeHabits.length > 0 ? (completedHabitsToday / activeHabits.length) * 100 : 0
      const tasksProgress = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0

      // Progression quotidienne = uniquement le pourcentage d'habitudes complétées
      const todayProgress = Math.round(habitsProgress)

      // Score de productivité global (habitudes + tâches), même logique que l'app mobile
      let productivityScore = 0
      if (activeHabits.length > 0 && totalTasks > 0) {
        productivityScore = Math.round((habitsProgress + tasksProgress) / 2)
      } else if (activeHabits.length > 0) {
        productivityScore = Math.round(habitsProgress)
      } else if (totalTasks > 0) {
        productivityScore = Math.round(tasksProgress)
      }

      // Get focus hours from deep work stats (même endpoint que sur mobile)
      const deepWorkRes = await fetch("/api/dashboard/deepwork-stats")
      const deepWork = await safeJsonResponse(deepWorkRes, "dashboard/deepwork-stats")

      let focusHours = 0
      if (deepWork?.today) {
        if (typeof deepWork.today.seconds === "number") {
          focusHours = deepWork.today.seconds / 3600
        } else if (typeof deepWork.today.hours === "number") {
          focusHours = deepWork.today.hours
        }
      }

      // Get deep work metrics for performance section
      const totalDeepWorkHours = Math.round(deepWork?.allTime?.hours || 0)
      const weeklyDeepWorkHours = Math.round(deepWork?.week?.hours || 0)
      const bestSession = deepWork?.bestSession || 'N/A'

      // Get streak from gamification
      const gamificationRes = await fetch("/api/gamification/stats")
      const gamification = await safeJsonResponse(gamificationRes, "gamification/stats")
      const streakDays = gamification?.currentStreak || gamification?.streak || 0

      // Get achievements
      const achievementsRes = await fetch("/api/gamification/achievements")
      const achievementsData = await safeJsonResponse(achievementsRes, "gamification/achievements")
      
      // Get unlocked achievements (most recent first) and locked achievements
      const unlocked = (achievementsData?.achievements || [])
        .filter((a: any) => a.unlocked && a.unlockedAt)
        .sort((a: any, b: any) => {
          const dateA = new Date(a.unlockedAt).getTime()
          const dateB = new Date(b.unlockedAt).getTime()
          return dateB - dateA // Most recent first
        })
        .map((a: any) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          type: a.type,
          points: a.points,
          threshold: a.threshold,
          unlocked: true,
          unlockedAt: a.unlockedAt
        }))
      
      const locked = (achievementsData?.achievements || [])
        .filter((a: any) => !a.unlocked)
        .map((a: any) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          type: a.type,
          points: a.points,
          threshold: a.threshold,
          unlocked: false
        }))
      
      // Combine: show up to 3 unlocked (most recent) + fill with locked to reach 5 total
      const combined = [
        ...unlocked.slice(0, 3),
        ...locked.slice(0, 5 - Math.min(unlocked.length, 3))
      ].slice(0, 5)
      
      setRecentAchievements(combined)

      // Format weekly data - le score combine déjà habitudes et tâches (même logique que l'API mobile)
      const dayNames = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')]
      const rawWeeklyData = weekly?.weeklyData?.slice(-7) || []
      const weeklyData = rawWeeklyData.length > 0
        ? rawWeeklyData.map((item: any, index: number) => ({
            day: dayNames[index] || item.day,
            score: item.score || 0
          }))
        : dayNames.map(day => ({ day, score: 0 }))

      // Score de productivité du jour utilisé par le graphique (dernier point)
      const todayWeeklyScore =
        rawWeeklyData.length > 0 && typeof rawWeeklyData[rawWeeklyData.length - 1]?.score === "number"
          ? rawWeeklyData[rawWeeklyData.length - 1].score
          : productivityScore

      // Format habits - afficher toutes les habitudes de l'utilisateur
      const allHabits = Array.isArray(habitsList) ? habitsList : []

      const formattedHabits = allHabits.map((habit: any) => ({
        id: habit.id,
        name: habit.name,
        completed: habit.entries?.some((e: any) => {
          const entryDate = new Date(e.date)
          const today = new Date()
          return entryDate.toDateString() === today.toDateString() && e.completed
        }) || false,
        streak: habit.currentStreak || 0,
        time: habit.reminderTime || undefined
      }))

      setHabitStates(formattedHabits)

      // Format leaderboard (supporte à la fois un tableau brut ou un objet { leaderboard, userRank, totalUsers })
      const leaderboardArray = Array.isArray(leaderboard)
        ? leaderboard
        : Array.isArray(leaderboard?.leaderboard)
          ? leaderboard.leaderboard
          : []

      // Identifier l'utilisateur courant à partir de la réponse /api/auth/me
      const currentUserId = user?.id || user?.userId || user?.sub

      const formattedLeaderboard = leaderboardArray.slice(0, 3).map((entry: any, index: number) => ({
        rank: index + 1,
        name: entry.name || entry.userName || entry.user?.name || "User",
        score: entry.totalPoints ?? entry.points ?? entry.score ?? 0,
        avatar: (entry.name || entry.userName || entry.user?.name || "U")[0].toUpperCase(),
        isUser: currentUserId ? (entry.userId === currentUserId || entry.id === currentUserId) : false
      }))

      // Format today's tasks
      const formattedTodayTasks = Array.isArray(todayTasks) ? todayTasks.slice(0, 5).map((task: any) => ({
        id: task.id,
        title: task.title,
        completed: task.completed || task.status === 'COMPLETED',
        priority: task.priority || 0,
        dueDate: task.dueDate,
        project: task.project
      })) : []

      setData({
        user: {
          name: user?.name || user?.userName || "User"
        },
        metrics: {
          todayProgress,
          focusHours: Math.round(focusHours * 10) / 10,
          streakDays,
          // IMPORTANT: on aligne le score d'aujourd'hui sur celui utilisé par le graphique hebdomadaire
          productivityScore: todayWeeklyScore,
          tasksCompleted,
          totalTasks
        },
        weeklyData,
        habits: formattedHabits,
        todayTasks: formattedTodayTasks,
        leaderboard: formattedLeaderboard,
        performanceMetrics: {
          totalDeepWorkHours,
          weeklyDeepWorkHours,
          bestSession,
          rank: formattedLeaderboard.findIndex(u => u.isUser) + 1 || 1
        }
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleHabit = async (habitId: string) => {
    const habit = habitStates.find(h => h.id === habitId)
    if (!habit || habit.completed) return

    try {
      // Mark habit as completed using the entries API
      const today = new Date()
      const response = await fetch("/api/habits/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          date: today.toISOString(),
          completed: true
        })
      })

      if (response.ok) {
        setHabitStates(prev =>
          prev.map(h =>
            h.id === habitId ? { ...h, completed: true } : h
          )
        )

        setCelebratingHabit(habitId)
        setTimeout(() => setCelebratingHabit(null), 1500)
        
        // Refresh dashboard data
        fetchDashboardData()
      }
    } catch (error) {
      console.error("Error completing habit:", error)
    }
  }

  const toggleTask = async (taskId: string) => {
    if (!data) return

    const task = data.todayTasks.find(t => t.id === taskId)
    if (!task) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !task.completed
        })
      })

      if (response.ok) {
        // Update local state
        setData(prev => prev ? {
          ...prev,
          todayTasks: prev.todayTasks.map(t => 
            t.id === taskId ? { ...t, completed: !t.completed } : t
          )
        } : null)
        
        // Refresh dashboard data to update metrics
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const createHabit = async () => {
    if (!newHabitName.trim()) return

    try {
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newHabitName.trim(),
          frequency: "daily",
          daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        })
      })

      if (response.ok) {
        const newHabit = await response.json()
        setNewHabitName('')
        setShowAddHabit(false)
        
        // Refresh dashboard data to show the new habit
        fetchDashboardData()
      } else {
        const error = await response.json()
        console.error("Error creating habit:", error)
        alert(error.error || t('errorCreatingHabit'))
      }
    } catch (error) {
      console.error("Error creating habit:", error)
      alert(t('errorCreatingHabit'))
    }
  }

  const sortedHabits = [...habitStates].sort((a, b) => {
    if (a.completed === b.completed) return 0
    return a.completed ? 1 : -1
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C27A] mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <p className="text-gray-600">{t('errorLoadingData')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Top Navigation Bar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm sticky top-0 z-50"
      >
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Brand */}
            <Link href="/dashboard" className="flex items-center gap-3 mr-auto">
              <Image
                src="/P_tech_letter_logo_TEMPLATE-removebg-preview.png"
                alt="Productif.io"
                width={64}
                height={64}
                className="object-contain"
              />
              <h1 className="text-2xl text-gray-900 whitespace-nowrap">
                Productif.io
              </h1>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-2xl flex items-center gap-2 shadow-md"
              >
                <Home size={20} />
                <span>{t('dashboard')}</span>
              </motion.button>

              <motion.button
                onClick={() => router.push("/dashboard/assistant-ia")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <Bot size={20} />
                <span>{t('aiAssistant')}</span>
              </motion.button>

              <motion.button
                onClick={() => router.push("/dashboard/analytics")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <TrendingUp size={20} />
                <span>{t('analytics')}</span>
              </motion.button>

              <motion.button
                onClick={() => router.push("/dashboard/tasks")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <CheckCircle2 size={20} />
                <span>{t('tasks')}</span>
              </motion.button>

              <motion.button
                onClick={() => router.push("/dashboard/leaderboard")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <Trophy size={20} />
                <span>{t('leaderboard')}</span>
              </motion.button>

              <motion.button
                onClick={() => router.push("/dashboard/settings")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
                data-allow-click
              >
                <SettingsIcon size={20} />
                <span>{t('settings')}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content - Centered Container */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-gray-800 text-3xl mb-2">{t('hello')}, {data.user.name} 👋</h2>
            <p className="text-gray-600 text-lg">{t('makeTodayProductive')}</p>
          </motion.div>

          {/* Stats Grid - 4 Columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Daily Progress Card */}
            <div className="stat-card bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative z-10">
                <Target size={28} className="mb-3 opacity-90" />
                <p className="text-white/80 mb-2 text-sm">{t('dailyProgress')}</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-4xl">{data.metrics.todayProgress}%</p>
                </div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.metrics.todayProgress}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Focus Time Card */}
            <div className="stat-card bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
              <Clock size={28} className="text-[#00C27A] mb-3" />
              <p className="text-gray-600 mb-2 text-sm">{t('focusTime')}</p>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-gray-800 text-4xl">{data.metrics.focusHours}</p>
                <span className="text-gray-800 text-2xl">h</span>
              </div>
              <p className="text-[#00C27A] text-sm">{t('today')} 🎯</p>
            </div>

            {/* Streak Card */}
            <div className="stat-card bg-gradient-to-br from-orange-400 to-pink-500 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Flame size={28} className="mb-3 opacity-90" />
              </motion.div>
              <p className="text-white/80 mb-2 text-sm">{t('currentStreak')}</p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-4xl">{data.metrics.streakDays}</p>
                <span className="text-2xl">{t('days')}</span>
              </div>
              <p className="text-white/70 text-sm">{t('keepItUp')} 🏆</p>
            </div>

            {/* Productivity Score Card */}
            <div className="stat-card bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
              <Award size={28} className="mb-3 opacity-90" />
              <p className="text-white/80 mb-2 text-sm">Score d'aujourd'hui</p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-4xl">{data.metrics.productivityScore}</p>
                <span className="text-2xl">/100</span>
              </div>
              <p className="text-white/70 text-sm">{t('productivity')} ✨</p>
            </div>
          </motion.div>

          {/* Main Content Grid - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Charts & Analytics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Weekly Performance Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="dashboard-card bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-gray-800 text-xl mb-1">Performance hebdomadaire</h3>
                    <p className="text-gray-500 text-sm">Moyenne de productivité sur 7 jours</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/dashboard/analytics")}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white px-5 py-2.5 rounded-xl shadow-sm"
                  >
                    <TrendingUp size={18} />
                    <span>{t('fullAnalytics')}</span>
                  </motion.button>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '8px 12px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#00C27A" 
                      strokeWidth={3}
                      dot={{ fill: '#00C27A', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Stats Overview - Deep Work Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
              >
                <h3 className="text-gray-800 text-xl mb-6">{t('performanceMetrics')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#00C27A]/10 to-[#00D68F]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Clock size={28} className="text-[#00C27A]" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Temps total Deep Work</p>
                    <p className="text-[#00C27A] text-2xl">{data.performanceMetrics.totalDeepWorkHours}h</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/10 to-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Target size={28} className="text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Deep Work semaine</p>
                    <p className="text-purple-600 text-2xl">{data.performanceMetrics.weeklyDeepWorkHours}h</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400/10 to-pink-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Zap size={28} className="text-orange-500" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Meilleure session</p>
                    <p className="text-orange-500 text-2xl">{data.performanceMetrics.bestSession}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Trophy size={28} className="text-cyan-600" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{t('rank')}</p>
                    <p className="text-cyan-600 text-2xl">#{data.performanceMetrics.rank} 🏆</p>
                  </div>
                </div>
              </motion.div>

              {/* Tasks and Leaderboard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="dashboard-card bg-white rounded-3xl p-8 shadow-lg border border-gray-100 mt-12"
              >
                <div className="space-y-12">
                  {/* Tasks Summary */}
                  <div className="pb-12">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-gray-800 text-xl">{t('tasks')}</h3>
                      <button
                        onClick={() => router.push("/dashboard/tasks")}
                        className="text-[#00C27A] text-sm hover:underline"
                      >
                        {t('viewAll')} →
                      </button>
                    </div>
                    
                    {/* Tasks List */}
                    <div className="space-y-3">
                      {data.todayTasks.length > 0 ? (
                        data.todayTasks.map((task) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <motion.div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                                task.completed
                                  ? 'bg-[#00C27A] border-[#00C27A]' 
                                  : 'border-gray-300 hover:border-[#00C27A]/50'
                              }`}
                              whileHover={{ scale: task.completed ? 1 : 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleTask(task.id)}
                            >
                              {task.completed && (
                                <CheckCircle2 size={12} className="text-white" />
                              )}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                  {task.title}
                                </span>
                                {task.project && (
                                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded-full">
                                    {task.project.name}
                                  </span>
                                )}
                              </div>
                              {task.dueDate && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 text-sm">Aucune tâche pour aujourd'hui</p>
                          <p className="text-gray-400 text-xs mt-1">Excellent travail ! 🎉</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Summary at bottom */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Terminé</span>
                        <span className="text-[#00C27A] font-bold">{data.metrics.tasksCompleted}/{data.metrics.totalTasks}</span>
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-gray-200 -mx-8"></div>

                  {/* Leaderboard */}
                  <div className="pt-12">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-gray-800 text-xl">{t('leaderboard')}</h3>
                      <button
                        onClick={() => router.push("/dashboard/leaderboard")}
                        className="text-[#00C27A] text-sm hover:underline"
                      >
                        {t('viewAll')} →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {data.leaderboard.length > 0 ? data.leaderboard.map((user) => (
                        <div
                          key={user.rank}
                          className={`flex items-center justify-between p-3 rounded-xl ${
                            user.isUser ? 'bg-gradient-to-r from-[#00C27A]/10 to-[#00D68F]/10' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
                              user.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                              'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                            }`}>
                              {user.avatar}
                            </div>
                            <div>
                              <p className={`text-sm ${user.isUser ? 'text-[#00C27A]' : 'text-gray-800'}`}>
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500">{user.score} {t('points')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.rank === 1 && <span className="text-xl">👑</span>}
                            <span className="text-sm text-gray-400">#{user.rank}</span>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500 text-center py-4">{t('noLeaderboardData')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Habits & Quick Actions */}
            <div className="space-y-6">
              {/* Daily Habits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="dashboard-card bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-800 text-lg">{t('dailyHabits')}</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push("/dashboard/habits")}
                      className="text-[#00C27A] text-xs hover:underline"
                    >
                      {t('viewAll')} →
                    </button>
                    <div className="bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white px-3 py-1 rounded-full text-xs">
                      {sortedHabits.filter(h => h.completed).length}/{sortedHabits.length} {t('done')}
                    </div>
                  </div>
                </div>
                
                {/* Add Habit Button */}
                <motion.button
                  onClick={() => setShowAddHabit(!showAddHabit)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-xl shadow-sm flex items-center justify-center gap-2 mb-4 text-sm font-medium"
                >
                  <Plus size={16} />
                  <span>{t('addHabit')}</span>
                </motion.button>

                {/* Add Habit Form */}
                <AnimatePresence>
                  {showAddHabit && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <input
                          type="text"
                          value={newHabitName}
                          onChange={(e) => setNewHabitName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              createHabit()
                            } else if (e.key === 'Escape') {
                              setShowAddHabit(false)
                              setNewHabitName('')
                            }
                          }}
                          placeholder={t('habitNamePlaceholder')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00C27A]"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <motion.button
                            onClick={createHabit}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 py-2 bg-[#00C27A] text-white rounded-lg text-sm font-medium"
                          >
                            {t('create')}
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              setShowAddHabit(false)
                              setNewHabitName('')
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                          >
                            {t('cancel')}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  {sortedHabits.length > 0 ? sortedHabits.map((habit, index) => {
                    const isCelebrating = celebratingHabit === habit.id
                    return (
                      <motion.div
                        key={habit.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="relative"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                              habit.completed 
                                ? 'bg-[#00C27A] border-[#00C27A]' 
                                : 'border-gray-300 hover:border-[#00C27A]/50'
                            }`}
                            whileHover={{ scale: habit.completed ? 1 : 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleHabit(habit.id)}
                          >
                            {habit.completed && (
                              <CheckCircle2 size={16} className="text-white" />
                            )}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm ${habit.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {habit.name}
                              </span>
                              {habit.time && (
                                <span className="text-xs text-gray-400">{habit.time}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: habit.completed ? "100%" : "0%" }}
                                  transition={{ duration: 0.8 }}
                                />
                              </div>
                              <span className="text-xs text-[#00C27A] whitespace-nowrap flex items-center gap-1">
                                <Flame size={12} /> {habit.streak}d
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {isCelebrating && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl"
                            >
                              <span className="text-3xl">🎉</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  }) : (
                    <p className="text-sm text-gray-500 text-center py-4">{t('noHabitsToday')}</p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Achievements Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-800 text-xl mb-1">{t('recentAchievements')}</h3>
                <p className="text-gray-500 text-sm">{t('unlockedBadgesChallenges')}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard/achievements")}
                className="flex items-center gap-2 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white px-5 py-2.5 rounded-xl shadow-sm"
              >
                <Award size={18} />
                <span>{t('viewAllAchievements')}</span>
              </motion.button>
            </div>
            <div className="grid grid-cols-5 gap-6 dashboard-card">
              {recentAchievements.length > 0 ? recentAchievements.map((achievement, index) => {
                const TYPE_ICONS: Record<string, any> = {
                  STREAK: Clock,
                  HABITS: Target,
                  PERFECT_DAY: Star,
                  POINTS: Trophy,
                  TASKS: Zap,
                  OBJECTIVES: Award
                }
                
                const Icon = TYPE_ICONS[achievement.type] || Award
                
                const gradientMap: Record<string, string> = {
                  STREAK: "from-cyan-400 to-blue-500",
                  HABITS: "from-[#00C27A] to-[#00D68F]",
                  PERFECT_DAY: "from-amber-400 to-orange-500",
                  POINTS: "from-purple-400 to-pink-500",
                  TASKS: "from-orange-400 to-pink-500",
                  OBJECTIVES: "from-indigo-400 to-purple-500",
                }
                
                // Use colored gradient for unlocked, gray for locked
                const gradientColors = achievement.unlocked
                  ? (gradientMap[achievement.type] || "from-gray-400 to-gray-500")
                  : "from-gray-200 to-gray-300"
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    className={`bg-gradient-to-br ${gradientColors} rounded-3xl p-6 shadow-xl relative overflow-hidden cursor-pointer ${
                      achievement.unlocked ? 'text-white' : 'text-gray-700 opacity-75'
                    }`}
                    onClick={() => router.push("/dashboard/achievements")}
                  >
                    {achievement.unlocked && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <Icon size={28} className={achievement.unlocked ? "opacity-90" : "opacity-60"} />
                        <div className={`rounded-full p-1 ${
                          achievement.unlocked ? "bg-white/20" : "bg-gray-300/50"
                        }`}>
                          <Trophy size={14} className={achievement.unlocked ? "text-white" : "text-gray-500"} />
                        </div>
                      </div>
                      <h3 className={`text-base font-bold mb-2 line-clamp-2 ${
                        achievement.unlocked ? "text-white" : "text-gray-800"
                      }`}>
                        {t(achievement.name) || achievement.name}
                      </h3>
                      <p className={`text-xs mb-3 line-clamp-2 ${
                        achievement.unlocked ? "text-white/80" : "text-gray-600"
                      }`}>
                        {t(achievement.description) || achievement.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1 rounded-full px-2 py-1 ${
                          achievement.unlocked 
                            ? "bg-white/20" 
                            : "bg-gray-300/50"
                        }`}>
                          <span className={`text-xs ${
                            achievement.unlocked ? "text-white" : "text-gray-700"
                          }`}>
                            {achievement.unlocked ? `${t('unlocked')} ✨` : `${achievement.threshold} ${t('required')}`}
                          </span>
                        </div>
                        <span className={`text-xs font-medium ${
                          achievement.unlocked ? "text-white" : "text-gray-600"
                        }`}>
                          {achievement.points} {t('points')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              }) : (
                <div className="col-span-5 text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">{t('noAchievementsAvailable')}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1, boxShadow: "0 10px 30px rgba(0, 194, 122, 0.4)" }}
        whileTap={{ scale: 0.9 }}
        onClick={() => router.push("/dashboard/tasks?action=create")}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center shadow-2xl z-40"
      >
        <Plus size={28} className="text-white" />
      </motion.button>
    </div>
  )
}

