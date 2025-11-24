"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Crown, Medal, Star, Users, ChevronRight } from "lucide-react"
import { LeaderboardEntry } from "@/services/gamification"

const LEVEL_COLORS = {
  1: 'text-gray-600',
  2: 'text-blue-600',
  3: 'text-green-600',
  4: 'text-purple-600',
  5: 'text-yellow-600',
} as const

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-4 w-4 text-yellow-500" />
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />
    case 3:
      return <Medal className="h-4 w-4 text-amber-600" />
    default:
      return <span className="text-xs font-bold text-gray-500">#{rank}</span>
  }
}

export function LeaderboardCompact() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        limit: '5',
        includeUserRank: 'true'
      })
      
      const response = await fetch(`/api/gamification/leaderboard?${params}`)
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement du classement")
      }
      
      const data = await response.json()
      setLeaderboard(data.leaderboard)
      setUserRank(data.userRank)
    } catch (error) {
      console.error('Erreur lors du chargement du leaderboard compact:', error)
      setError("Impossible de charger le classement")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5" />
            Top Classement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-6 h-6 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-1" />
                  <div className="h-2 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5" />
            Top Classement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <Trophy className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Aucun classement disponible</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5" />
            Top Classement
          </CardTitle>
          {userRank && userRank > 5 && (
            <Badge variant="outline" className="text-xs">
              Vous: #{userRank}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.slice(0, 5).map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                entry.rank <= 3 
                  ? 'bg-gradient-to-r from-yellow-50 to-amber-50' 
                  : 'bg-gray-50'
              }`}
            >
              {/* Rang */}
              <div className="flex items-center justify-center w-6">
                {getRankIcon(entry.rank)}
              </div>

              {/* Informations utilisateur */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {entry.userName}
                  </p>
                  <Crown className={`h-3 w-3 ${LEVEL_COLORS[Math.min(entry.level, 5) as keyof typeof LEVEL_COLORS] || 'text-gray-600'}`} />
                  <span className="text-xs text-gray-500">
                    Niv.{entry.level}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Star className="h-2.5 w-2.5" />
                    <span>{entry.points.toLocaleString()}</span>
                  </div>
                  <span>•</span>
                  <span>{entry.currentStreak}j streak</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Afficher la position de l'utilisateur s'il n'est pas dans le top 5 */}
        {userRank && userRank > 5 && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Users className="h-4 w-4" />
              <span>Votre position : #{userRank}</span>
            </div>
          </div>
        )}

        {/* Lien vers le classement complet */}
        <div className="mt-4">
          <Link href="/dashboard/leaderboard">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>Voir le classement complet</span>
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
} 