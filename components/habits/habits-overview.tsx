"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { OverviewCard } from "@/components/dashboard/overview-card"

interface HabitStats {
  total: number
  completed: number
  rate: number
}

export function HabitsOverview() {
  const [stats, setStats] = useState<HabitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      // Vérifier si la dernière requête a été faite il y a moins de 30 secondes
      const now = Date.now()
      if (now - lastFetch < 30000 && !loading) {
        console.log("Évitement d'une requête trop fréquente pour les stats d'habitudes")
        return
      }
      
      try {
        const response = await fetch(`/api/habits/stats?format=simple&t=${now}`, {
          cache: 'no-store'
        })
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des statistiques")
        }
        const data = await response.json()
        setStats(data)
        setLastFetch(now)
      } catch (error) {
        console.error("Erreur:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Rafraîchir les données toutes les 5 minutes au lieu de 30 secondes
    const interval = setInterval(fetchStats, 5 * 60 * 1000) // 5 minutes en millisecondes
    return () => clearInterval(interval)
  }, [lastFetch, loading])

  if (loading || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-2 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mt-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full mt-2"></div>
            <div className="h-4 bg-gray-200 rounded w-40 mt-2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <OverviewCard
      title="Habitudes du jour"
      count={`${stats.completed}/${stats.total}`}
      icon={<Activity className="h-4 w-4 text-muted-foreground" />}
      progress={stats.rate}
      description={`${stats.rate}% des habitudes prévues`}
    />
  )
} 