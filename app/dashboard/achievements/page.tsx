"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, Target, Zap, Calendar, Award } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  points: number
  condition: any
  unlocked: boolean
  unlockedAt?: string
}

interface AchievementsData {
  achievements: Achievement[]
  grouped: Record<string, Achievement[]>
  totalUnlocked: number
  totalAvailable: number
}

const CATEGORY_ICONS = {
  streak: Calendar,
  completion: Target,
  consistency: Star,
  milestone: Trophy,
  special: Award
}

const CATEGORY_NAMES = {
  streak: "Séries",
  completion: "Complétion",
  consistency: "Régularité",
  milestone: "Étapes",
  special: "Spéciaux"
}

const RARITY_COLORS = {
  common: "bg-gray-100 text-gray-800",
  rare: "bg-blue-100 text-blue-800",
  epic: "bg-purple-100 text-purple-800",
  legendary: "bg-yellow-100 text-yellow-800"
}

const RARITY_NAMES = {
  common: "Commun",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire"
}

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

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
      console.error("Erreur lors du chargement des achievements:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Impossible de charger les achievements</p>
        </div>
      </div>
    )
  }

  const completionPercentage = Math.round((data.totalUnlocked / data.totalAvailable) * 100)

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case "🔥": return <Zap className="h-6 w-6 text-orange-500" />
      case "🎯": return <Target className="h-6 w-6 text-blue-500" />
      case "⭐": return <Star className="h-6 w-6 text-yellow-500" />
      case "🏆": return <Trophy className="h-6 w-6 text-yellow-600" />
      case "📅": return <Calendar className="h-6 w-6 text-green-500" />
      default: return <Award className="h-6 w-6 text-gray-500" />
    }
  }

  const filteredAchievements = selectedCategory === "all" 
    ? data.achievements 
    : data.grouped[selectedCategory] || []

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Achievements</h1>
            <p className="text-gray-600">
              Débloquez des récompenses en accomplissant vos objectifs
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{data.totalUnlocked}/{data.totalAvailable}</div>
            <div className="text-sm text-gray-500">Débloqués</div>
          </div>
        </div>

        {/* Progression globale */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Progression globale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Achievements débloqués</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Filtres par catégorie */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Tous</TabsTrigger>
            {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
              <TabsTrigger key={key} value={key}>
                {name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((achievement) => {
                const CategoryIcon = CATEGORY_ICONS[achievement.category as keyof typeof CATEGORY_ICONS] || Award
                
                return (
                  <Card 
                    key={achievement.id} 
                    className={`transition-all duration-200 ${
                      achievement.unlocked 
                        ? "border-green-200 bg-green-50" 
                        : "border-gray-200 opacity-75"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getAchievementIcon(achievement.icon)}
                          <div>
                            <CardTitle className="text-lg">{achievement.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="secondary" 
                                className={RARITY_COLORS[achievement.rarity as keyof typeof RARITY_COLORS]}
                              >
                                {RARITY_NAMES[achievement.rarity as keyof typeof RARITY_NAMES]}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {achievement.points} pts
                              </span>
                            </div>
                          </div>
                        </div>
                        {achievement.unlocked && (
                          <div className="text-green-600">
                            <Trophy className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {achievement.description}
                      </CardDescription>
                      {achievement.unlocked && achievement.unlockedAt && (
                        <div className="mt-3 text-xs text-green-600">
                          Débloqué le {new Date(achievement.unlockedAt).toLocaleDateString("fr-FR")}
                        </div>
                      )}
                      {!achievement.unlocked && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-500 mb-1">Condition:</div>
                          <div className="text-xs text-gray-700">
                            {achievement.condition.streakDays && `Maintenir un streak de ${achievement.condition.streakDays} jours`}
                            {achievement.condition.totalHabits && `Compléter ${achievement.condition.totalHabits} habitudes`}
                            {achievement.condition.perfectDay && "Réaliser une journée parfaite"}
                            {achievement.condition.totalPoints && `Atteindre ${achievement.condition.totalPoints} points`}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredAchievements.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun achievement dans cette catégorie</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 