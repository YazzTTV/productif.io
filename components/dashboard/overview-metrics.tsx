"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, Target, Activity, RefreshCw, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface OverviewMetricsProps {
  className?: string
}

interface DashboardMetrics {
  tasks: {
    today: number
    completed: number
    completionRate: number
    totalCompletedToday?: number
    createdToday?: number
  }
  habits: {
    today: number
    completed: number
    completionRate: number
    streak: number
  }
  objectives: {
    count: number
    progress: number
  }
  productivity: {
    score: number
    trend: "up" | "down" | "neutral"
    change: number
  }
  debug?: {
    serverTime: string
    timeZone: string
  }
}

export function OverviewMetrics({ className }: OverviewMetricsProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const fetchMetrics = async () => {
    setIsRefreshing(true)
    
    try {
      // Récupérer les métriques générales
      const response = await fetch("/api/dashboard/metrics")
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des métriques")
      }
      
      const data = await response.json()
      
      // Récupérer les tâches du jour directement depuis l'API tâches du jour
      // pour assurer la cohérence avec le composant TodayStats
      const tasksResponse = await fetch("/api/tasks/today")
      if (!tasksResponse.ok) {
        throw new Error("Erreur lors du chargement des tâches du jour")
      }
      const tasksData = await tasksResponse.json()
      
      // Calculer les métriques des tâches du jour
      const todayTasks = {
        today: tasksData.length,
        completed: tasksData.filter((t: any) => t.completed).length,
        completionRate: tasksData.length > 0 
          ? Math.round((tasksData.filter((t: any) => t.completed).length / tasksData.length) * 100)
          : 0,
        totalCompletedToday: data.tasks.totalCompletedToday,
        createdToday: data.tasks.createdToday
      }
      
      // Mettre à jour les métriques en remplaçant celles des tâches
      setMetrics({
        ...data,
        tasks: todayTasks
      })
      
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Erreur:", error)
      // Utiliser des données fictives en cas d'erreur pour développement
      setMetrics({
        tasks: {
          today: 5,
          completed: 3,
          completionRate: 60
        },
        habits: {
          today: 4,
          completed: 2,
          completionRate: 50,
          streak: 7
        },
        objectives: {
          count: 3,
          progress: 35
        },
        productivity: {
          score: 75,
          trend: "up",
          change: 5
        }
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-2 w-full bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {lastUpdated && (
            <span>Dernière mise à jour : {lastUpdated}</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMetrics}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
        </div>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tâches du jour</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.tasks.completed}/{metrics.tasks.today}
            </div>
            <Progress 
              value={metrics.tasks.completionRate} 
              className="h-2 mt-2" 
            />
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-xs text-muted-foreground">
                {metrics.tasks.completionRate}% des tâches du jour complétées
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Habitudes du jour</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.habits.completed}/{metrics.habits.today}
            </div>
            <Progress
              value={metrics.habits.completionRate}
              className="h-2 mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.habits.today === 0 
                ? "Aucune habitude programmée aujourd'hui" 
                : `${metrics.habits.completionRate}% des habitudes prévues`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Objectifs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.objectives.progress}%</div>
            <Progress
              value={metrics.objectives.progress}
              className="h-2 mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.objectives.count} objectifs en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productivité</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.productivity.score}%</div>
            <Progress
              value={metrics.productivity.score}
              className="h-2 mt-2"
            />
            <p className="text-xs flex items-center mt-1">
              {metrics.productivity.trend === "up" ? (
                <span className="text-green-600 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +{metrics.productivity.change}%
                </span>
              ) : metrics.productivity.trend === "down" ? (
                <span className="text-red-600 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  -{metrics.productivity.change}%
                </span>
              ) : (
                <span className="text-gray-600">Stable</span>
              )}
              <span className="text-muted-foreground text-xs ml-1">cette semaine</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 