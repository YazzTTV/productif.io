"use client"

import { useEffect, useState } from "react"
import { safeJsonResponse } from "@/lib/api-utils"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Flame, 
  Star, 
  Target, 
  TrendingUp,
  Award,
  Zap,
  Crown
} from "lucide-react"
import Link from "next/link"

interface GamificationStats {
  points: number
  level: number
  currentStreak: number
  longestStreak: number
  pointsToNextLevel: number
  recentAchievements: Achievement[]
}

interface Achievement {
  id: string
  name: string
  description: string
  type: string
  threshold: number
  points: number
  unlockedAt?: Date
}

const RARITY_COLORS = {
  common: "bg-gray-100 text-gray-800 border-gray-200",
  rare: "bg-blue-100 text-blue-800 border-blue-200",
  epic: "bg-purple-100 text-purple-800 border-purple-200",
  legendary: "bg-yellow-100 text-yellow-800 border-yellow-200"
}

const LEVEL_COLORS = {
  1: 'text-gray-600',
  2: 'text-blue-600',
  3: 'text-green-600',
  4: 'text-purple-600',
  5: 'text-yellow-600',
} as const

const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    trophy: Trophy,
    flame: Flame,
    fire: Flame,
    star: Star,
    target: Target,
    "check-circle": Target,
    zap: Zap,
    crown: Crown,
    gem: Award,
    diamond: Award,
    coins: Award,
    play: TrendingUp
  }
  
  return icons[iconName] || Trophy
}

export function GamificationOverview() {
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGamificationStats()
  }, [])

  const fetchGamificationStats = async () => {
    try {
      const response = await fetch('/api/gamification/stats')
      const data = await safeJsonResponse(response, 'gamification/stats')
      setStats(data)
    } catch (error) {
      console.error('Erreur lors du chargement des stats de gamification:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Impossible de charger les statistiques de progression.
          </p>
        </CardContent>
      </Card>
    )
  }

  const levelProgress = stats.pointsToNextLevel > 0 
    ? ((stats.points % 100) / (stats.points + stats.pointsToNextLevel)) * 100
    : 100

  return (
    <div className="space-y-6">
      {/* Carte principale de progression */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Progression
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Niveau et points */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Crown className={`h-6 w-6 ${LEVEL_COLORS[Math.min(stats.level, 5) as keyof typeof LEVEL_COLORS] || 'text-gray-600'}`} />
                <span className="text-2xl font-bold">Niveau {stats.level}</span>
              </div>
              <p className="text-sm text-gray-500">
                {stats.points.toLocaleString()} points
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Prochain niveau</p>
              <p className="font-medium">
                {stats.pointsToNextLevel > 0 
                  ? `${stats.pointsToNextLevel} points`
                  : "Niveau max atteint !"
                }
              </p>
            </div>
          </div>

          {/* Barre de progression du niveau */}
          {stats.pointsToNextLevel > 0 && (
            <div className="space-y-2">
              <Progress value={levelProgress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">
                Progression vers le niveau {stats.level + 1}
              </p>
            </div>
          )}

          {/* Statistiques en grille */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-orange-700">
                {stats.currentStreak}
              </div>
              <div className="text-xs text-orange-600">Streak actuel</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Target className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-700">
                {stats.points}
              </div>
              <div className="text-xs text-blue-600">Points totaux</div>
            </div>
          </div>

          {/* Record personnel */}
          {stats.longestStreak > 0 && (
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">
                  Record personnel
                </span>
              </div>
              <div className="text-xl font-bold text-yellow-800">
                {stats.longestStreak} jours
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements récents */}
      {stats.recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Achievements récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentAchievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {achievement.name}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {achievement.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {achievement.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-green-600">
                      +{achievement.points}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <Link href="/dashboard/achievements">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                >
                  Voir tous les achievements
                </motion.button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 