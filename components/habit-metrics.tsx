"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HabitMetricsProps {
  className?: string
}

interface HabitStats {
  total: number
  completed: number
  rate: number
}

export function HabitMetrics({ className }: HabitMetricsProps) {
  const [stats, setStats] = useState<HabitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/habits/stats?t=${new Date().getTime()}`)
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des statistiques")
      }
      const data = await response.json()
      setStats(data)
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(() => {
      fetchStats()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    fetchStats()
  }

  if (loading || !stats) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-2 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mt-2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-lg font-bold">Habitudes du jour</h2>
            <div className="text-3xl font-bold mt-1">
              {stats.completed}/{stats.total}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={refreshing}
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Rafraîchir</span>
          </Button>
        </div>
        
        <Progress 
          value={stats.rate} 
          className="h-2 my-2" 
        />
        
        <p className="text-sm text-muted-foreground">
          {stats.rate}% des habitudes prévues
        </p>
      </CardContent>
    </Card>
  )
} 