"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Trophy, Star, Target, Zap, Calendar, Award } from "lucide-react"
import { BackToDashboardButton } from "@/components/analytics/back-to-dashboard-button"
import { useLocale } from "@/lib/i18n"

interface Achievement {
  id: string
  name: string
  description: string
  type: string
  points: number
  threshold: number
  unlocked: boolean
  unlockedAt?: string
}

interface AchievementsData {
  achievements: Achievement[]
  grouped: Record<string, Achievement[]>
  totalUnlocked: number
  totalAvailable: number
}

const TYPE_ICONS = {
  STREAK: Calendar,
  HABITS: Target,
  PERFECT_DAY: Star,
  POINTS: Trophy,
  TASKS: Zap,
  OBJECTIVES: Award
}

export default function AchievementsPage() {
  const { t, locale } = useLocale()
  const [data, setData] = useState<AchievementsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>("all")
  
  const TYPE_NAMES = {
    STREAK: t('streaks'),
    HABITS: t('habits'),
    PERFECT_DAY: t('regularity'),
    POINTS: t('points'),
    TASKS: t('tasks'),
    OBJECTIVES: t('objectives')
  }

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      const response = await fetch("/api/gamification/achievements")
      if (response.ok) {
        const achievementsData = await response.json()
        setData(achievementsData)
      }
    } catch (error) {
      console.error("Error loading achievements:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded-3xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-3xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t('unableToLoadAchievements')}</p>
          </div>
        </div>
      </div>
    )
  }

  const completionPercentage = Math.round((data.totalUnlocked / data.totalAvailable) * 100)

  const filteredAchievements = selectedType === "all" 
    ? data.achievements 
    : data.grouped[selectedType] || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="space-y-8">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-800 text-3xl mb-2">{t('recentAchievements')}</h1>
              <p className="text-gray-600 text-lg">
                {t('unlockRewardsObjectives')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-800">{data.totalUnlocked}/{data.totalAvailable}</div>
                <div className="text-sm text-gray-500">{t('unlocked')}</div>
              </div>
              <BackToDashboardButton />
            </div>
          </div>

          {/* Progression globale */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-[#00C27A]" />
              <h3 className="text-gray-800 text-lg">{t('globalProgress')}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('unlockedAchievements')}</span>
                <span className="text-gray-800 font-medium">{completionPercentage}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Filtres par type */}
          <div className="flex items-center gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedType("all")}
              className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                selectedType === "all"
                  ? "bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t('all')}
            </motion.button>
            {Object.entries(TYPE_NAMES).map(([key, name]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedType(key)}
                className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                  selectedType === key
                    ? "bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {name}
              </motion.button>
            ))}
          </div>

          {/* Grille d'achievements */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredAchievements.map((achievement, index) => {
              const Icon = TYPE_ICONS[achievement.type as keyof typeof TYPE_ICONS] || Award
              
              const gradientMap: Record<string, string> = {
                STREAK: "from-cyan-400 to-blue-500",
                HABITS: "from-[#00C27A] to-[#00D68F]",
                PERFECT_DAY: "from-amber-400 to-orange-500",
                POINTS: "from-purple-400 to-pink-500",
                TASKS: "from-orange-400 to-pink-500",
                OBJECTIVES: "from-indigo-400 to-purple-500",
              }
              
              const gradientColors = achievement.unlocked
                ? gradientMap[achievement.type] || "from-gray-400 to-gray-500"
                : "from-gray-200 to-gray-300"

              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className={`bg-gradient-to-br ${gradientColors} rounded-3xl p-6 shadow-xl text-white relative overflow-hidden cursor-pointer ${
                    !achievement.unlocked ? "opacity-60" : ""
                  }`}
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
                      <Icon size={32} className="opacity-90" />
                      {achievement.unlocked && (
                        <div className="bg-white/20 rounded-full p-1">
                          <Trophy size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold mb-2">{t(achievement.name) || achievement.name}</h3>
                    <p className="text-sm text-white/80 mb-3">{t(achievement.description) || achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                        <span className="text-xs">
                          {achievement.unlocked ? `${t('unlocked')} ✨` : `${achievement.threshold} ${t('required')}`}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{achievement.points} {t('points')}</span>
                    </div>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <div className="mt-3 text-xs text-white/70">
                        {new Date(achievement.unlockedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('noAchievementsInCategory')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 