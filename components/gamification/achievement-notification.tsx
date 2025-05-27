"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  Flame, 
  Star, 
  Target, 
  TrendingUp,
  Award,
  Zap,
  Crown,
  X,
  Sparkles
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  points: number
  unlockedAt?: Date
}

interface AchievementNotificationProps {
  achievements: Achievement[]
  onClose: () => void
}

const RARITY_COLORS = {
  common: "bg-gray-100 text-gray-800 border-gray-300",
  rare: "bg-blue-100 text-blue-800 border-blue-300",
  epic: "bg-purple-100 text-purple-800 border-purple-300",
  legendary: "bg-yellow-100 text-yellow-800 border-yellow-300"
}

const RARITY_GRADIENTS = {
  common: "from-gray-400 to-gray-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-yellow-400 to-yellow-600"
}

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

export function AchievementNotification({ achievements, onClose }: AchievementNotificationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (achievements.length === 0) return

    // Auto-fermer après 5 secondes pour le dernier achievement
    if (currentIndex === achievements.length - 1) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Attendre la fin de l'animation
      }, 5000)

      return () => clearTimeout(timer)
    }

    // Passer au suivant après 3 secondes
    const timer = setTimeout(() => {
      setCurrentIndex(prev => Math.min(prev + 1, achievements.length - 1))
    }, 3000)

    return () => clearTimeout(timer)
  }, [currentIndex, achievements.length, onClose])

  if (achievements.length === 0 || !isVisible) return null

  const currentAchievement = achievements[currentIndex]
  const IconComponent = getIconComponent(currentAchievement.icon)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <Card className={`border-2 shadow-lg ${RARITY_COLORS[currentAchievement.rarity as keyof typeof RARITY_COLORS]} relative overflow-hidden`}>
          {/* Effet de brillance pour les achievements rares */}
          {currentAchievement.rarity !== 'common' && (
            <div className="absolute inset-0 opacity-20">
              <div className={`absolute inset-0 bg-gradient-to-r ${RARITY_GRADIENTS[currentAchievement.rarity as keyof typeof RARITY_GRADIENTS]} animate-pulse`} />
            </div>
          )}
          
          {/* Bouton de fermeture */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-black/10"
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
          >
            <X className="h-3 w-3" />
          </Button>

          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Icône avec effet spécial pour les achievements légendaires */}
              <div className="relative flex-shrink-0">
                <div className={`p-3 rounded-full bg-gradient-to-r ${RARITY_GRADIENTS[currentAchievement.rarity as keyof typeof RARITY_GRADIENTS]} text-white`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                {currentAchievement.rarity === 'legendary' && (
                  <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">
                    Achievement débloqué !
                  </span>
                </div>

                {/* Nom et rareté */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-sm truncate">
                    {currentAchievement.name}
                  </h3>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${RARITY_COLORS[currentAchievement.rarity as keyof typeof RARITY_COLORS]}`}
                  >
                    {currentAchievement.rarity}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {currentAchievement.description}
                </p>

                {/* Points */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">
                      +{currentAchievement.points} points
                    </span>
                  </div>

                  {/* Indicateur de progression si plusieurs achievements */}
                  {achievements.length > 1 && (
                    <div className="flex gap-1">
                      {achievements.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1.5 w-1.5 rounded-full ${
                            index === currentIndex ? 'bg-gray-600' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
} 