"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
      return <Trophy className="h-5 w-5 text-yellow-500" />
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />
    default:
      return <span className="text-sm font-bold text-gray-500">#{rank}</span>
  }
}

const getRankBadgeColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
    case 2:
      return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
    case 3:
      return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

export function Leaderboard({ limit = 50, showUserRank = true }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | undefined>()
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const displayLimit = showAll ? limit : 10

  useEffect(() => {
    fetchLeaderboard()
  }, [limit, showUserRank])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        includeUserRank: showUserRank.toString()
      })
      
      const response = await fetch(`/api/gamification/leaderboard?${params}`)
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement du classement")
      }
      
      const data = await response.json()
      setLeaderboard(data.leaderboard)
      setUserRank(data.userRank)
      setTotalUsers(data.totalUsers)
    } catch (error) {
      console.error('Erreur lors du chargement du leaderboard:', error)
      setError("Impossible de charger le classement")
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
            Classement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Classement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchLeaderboard} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Classement Global
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              {totalUsers} utilisateurs
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Rang de l'utilisateur actuel */}
          {showUserRank && userRank && userRank > displayLimit && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Target className="h-4 w-4" />
                <span className="font-medium">Votre position : #{userRank}</span>
              </div>
            </div>
          )}

          {/* Liste du classement */}
          <div className="space-y-2">
            {leaderboard.slice(0, displayLimit).map((entry, index) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  entry.rank <= 3 
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* Rang */}
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Informations utilisateur */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {entry.userName}
                    </p>
                    <Crown className={`h-4 w-4 ${LEVEL_COLORS[Math.min(entry.level, 5) as keyof typeof LEVEL_COLORS] || 'text-gray-600'}`} />
                    <span className="text-xs text-gray-500">
                      Niv. {entry.level}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>{entry.totalPoints.toLocaleString()} pts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      <span>{entry.currentStreak}j</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>{entry.totalHabitsCompleted}</span>
                    </div>
                    {entry.achievements > 0 && (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        <span>{entry.achievements}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge de rang */}
                <Badge className={`${getRankBadgeColor(entry.rank)} border-0 text-xs`}>
                  #{entry.rank}
                </Badge>
              </div>
            ))}
          </div>

          {/* Bouton pour afficher plus/moins */}
          {leaderboard.length > 10 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Afficher moins
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Afficher plus ({leaderboard.length - displayLimit} autres)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Message si pas de données */}
          {leaderboard.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>Aucun utilisateur dans le classement pour le moment.</p>
              <p className="text-sm">Commencez à compléter des habitudes pour apparaître ici !</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques additionnelles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Champion</p>
                <p className="font-bold">
                  {leaderboard[0]?.userName || "Aucun"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Participants</p>
                <p className="font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Top Points</p>
                <p className="font-bold">
                  {leaderboard[0]?.totalPoints.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 