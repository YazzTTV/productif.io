"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Crown, 
  Medal, 
  Star, 
  Flame, 
  Target,
  Users,
  ChevronUp,
  ChevronDown,
  RotateCcw
} from "lucide-react"
import { LeaderboardEntry } from "@/services/gamification"
import { safeJsonResponse } from "@/lib/api-utils"

interface LeaderboardProps {
  limit?: number
  showUserRank?: boolean
}

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
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
          <Trophy className="h-5 w-5 text-white" />
        </div>
      )
    case 2:
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg">
          <Medal className="h-5 w-5 text-white" />
        </div>
      )
    case 3:
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <Medal className="h-5 w-5 text-white" />
        </div>
      )
    default:
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-600">#{rank}</span>
        </div>
      )
  }
}

const getRankBadgeColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md"
    case 2:
      return "bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-md"
    case 3:
      return "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md"
    default:
      return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700"
  }
}

export function Leaderboard({ limit = 50, showUserRank = true }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | undefined>()
  const [totalUsers, setTotalUsers] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const displayLimit = showAll ? limit : 10

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        includeUserRank: showUserRank.toString()
      })
      
      const response = await fetch(`/api/gamification/leaderboard?${params}`)
      
      if (!response.ok) {
        throw new Error("Error loading leaderboard")
      }
      
      const data = await safeJsonResponse(response, "gamification/leaderboard")
      setLeaderboard(data.leaderboard || [])
      setUserRank(data.userRank)
      setTotalUsers(data.totalUsers || 0)
      
      // Get current user ID
      try {
        const userRes = await fetch("/api/auth/me")
        const user = await safeJsonResponse(userRes, "auth/me")
        setCurrentUserId(user.id || null)
      } catch (err) {
        console.error("Error fetching user:", err)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
      setError("Unable to load leaderboard")
    } finally {
      setLoading(false)
    }
  }, [limit, showUserRank])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
      >
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-5 w-5 text-[#00C27A]" />
          <h3 className="text-gray-800 text-lg">Leaderboard</h3>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
      >
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-5 w-5 text-[#00C27A]" />
          <h3 className="text-gray-800 text-lg">Leaderboard</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // Vérifier que leaderboard est un tableau
  const safeLeaderboard = Array.isArray(leaderboard) ? leaderboard : []

  return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
        >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#00C27A]" />
            <h3 className="text-gray-800 text-lg">Global Leaderboard</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            {totalUsers} users
          </div>
        </div>
        <div>
          {/* Current user rank */}
          {showUserRank && userRank && userRank > displayLimit && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 bg-gradient-to-r from-[#00C27A]/20 via-[#00D68F]/20 to-[#00C27A]/20 border-2 border-[#00C27A] rounded-2xl shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C27A] to-[#00D68F] flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Your position</p>
                  <p className="text-lg font-bold text-[#00C27A]">#{userRank}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Leaderboard list */}
          <div className="space-y-3">
            {safeLeaderboard.slice(0, displayLimit).map((entry, index) => {
              if (!entry || !entry.userId) return null
              
              const isTop3 = (entry.rank || 0) <= 3
              const isUser = currentUserId ? entry.userId === currentUserId : false
              
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={`flex items-center gap-4 p-5 rounded-2xl transition-all ${
                    isUser
                      ? 'bg-gradient-to-r from-[#00C27A]/10 to-[#00D68F]/10 border-2 border-[#00C27A] shadow-md'
                      : isTop3
                      ? 'bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300 shadow-lg' 
                      : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
                  }`}
                >
                  {/* Rang avec icône */}
                  {getRankIcon(entry.rank || 0)}

                  {/* Informations utilisateur */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className={`font-semibold text-base truncate ${
                        isUser ? 'text-[#00C27A]' : 'text-gray-800'
                      }`}>
                        {entry.userName || 'Unknown user'}
                      </p>
                      {isUser && (
                        <span className="px-2 py-0.5 bg-[#00C27A] text-white text-xs rounded-full font-medium">
                          You
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-2">
                      <Crown className={`h-4 w-4 ${LEVEL_COLORS[Math.min(entry.level || 1, 5) as keyof typeof LEVEL_COLORS] || 'text-gray-600'}`} />
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        Lvl. {entry.level || 1}
                      </span>
                    </div>
                  
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-lg">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="font-medium">{(entry.points || 0).toLocaleString()} pts</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-lg">
                        <Flame className="h-3.5 w-3.5 text-orange-500" />
                        <span className="font-medium">{entry.currentStreak || 0}j</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-lg">
                        <Trophy className="h-3.5 w-3.5 text-purple-500" />
                        <span className="font-medium">{entry.longestStreak || 0}j max</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge de rang */}
                  <div className={`${getRankBadgeColor(entry.rank || 0)} rounded-xl px-4 py-2 font-bold text-sm min-w-[60px] text-center`}>
                    #{entry.rank || 0}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Show more/less button */}
          {safeLeaderboard.length > 10 && (
            <div className="mt-6 text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all flex items-center gap-2 mx-auto shadow-sm font-medium"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show more ({safeLeaderboard.length - displayLimit} more)
                  </>
                )}
              </motion.button>
            </div>
          )}

          {/* Empty state message */}
          {safeLeaderboard.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No users in the leaderboard yet.</p>
              <p className="text-sm">Start completing habits to appear here!</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Statistiques additionnelles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Champion</p>
              <p className="font-bold text-gray-800">
                {safeLeaderboard[0]?.userName || "None"}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Participants</p>
              <p className="font-bold text-gray-800">{totalUsers || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-xl">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Top Points</p>
              <p className="font-bold text-gray-800">
                {safeLeaderboard[0]?.points ? safeLeaderboard[0].points.toLocaleString() : "0"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 