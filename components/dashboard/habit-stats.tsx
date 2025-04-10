"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DailyStats {
  date: string
  formattedDate: string
  total: number
  completed: number
  completionRate: number
}

interface HabitStats {
  totalHabits: number
  completedHabits: number
  completionRate: number
  dailyStats: DailyStats[]
}

interface HabitStatsProps {
  className?: string
}

export default function HabitStats({ className }: HabitStatsProps) {
  const [stats, setStats] = useState<HabitStats>({
    totalHabits: 0,
    completedHabits: 0,
    completionRate: 0,
    dailyStats: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const fetchStats = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/habits/stats?t=${new Date().getTime()}`, {
        cache: 'no-store'
      })
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des statistiques")
      }
      const data = await response.json()
      setStats(data)
      setLastUpdated(format(new Date(), 'HH:mm:ss', { locale: fr }))
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Rafraîchir toutes les 5 minutes au lieu de chaque minute
    // pour éviter les requêtes trop fréquentes
    const interval = setInterval(() => {
      // Vérifier si l'onglet est actif avant de rafraîchir
      if (document.visibilityState === 'visible') {
        console.log("Rafraîchissement automatique des statistiques d'habitudes")
        fetchStats()
      }
    }, 5 * 60 * 1000) // 5 minutes en millisecondes
    
    // Ajouter un écouteur d'événement pour rafraîchir lorsque l'onglet devient visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Onglet visible, rafraîchissement des statistiques")
        fetchStats()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  if (isLoading) {
    return (
      <Card className={cn("col-span-1 md:col-span-2", className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Suivi des habitudes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-16 bg-gray-200 rounded" />
            <div className="h-[400px] bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("col-span-1 md:col-span-2", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Suivi des habitudes
        </CardTitle>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Mis à jour à {lastUpdated}
            </span>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchStats}
            disabled={isRefreshing}
            className="h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="last30days">
          <TabsList className="mb-4">
            <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
            <TabsTrigger value="last30days">30 derniers jours</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today">
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{Math.round(stats.completionRate)}%</div>
                <div className="text-sm text-muted-foreground">
                  {stats.completedHabits} habitudes complétées sur {stats.totalHabits}
                  {stats.totalHabits === 0 && (
                    <span className="block mt-1 text-xs italic">
                      Aucune habitude programmée pour aujourd'hui
                    </span>
                  )}
                  {stats.totalHabits > 0 && (
                    <span className="block mt-1 text-xs">
                      Seules les habitudes programmées pour aujourd'hui sont comptabilisées
                    </span>
                  )}
                </div>
              </div>
              <Progress
                value={stats.completionRate}
                className="h-2"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="last30days">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.dailyStats}
                  margin={{
                    top: 5,
                    right: 5,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formattedDate" 
                    tick={{ fontSize: 12 }}
                    interval={1}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Habitudes complétées']}
                    labelFormatter={(value) => `Date: ${value}`}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as DailyStats;
                        return (
                          <div className="bg-white p-2 border rounded shadow-sm">
                            <p className="font-bold">{label}</p>
                            <p>Complétion: {data.completionRate}%</p>
                            <p className="text-xs">{data.completed} / {data.total} habitudes</p>
                            {data.total === 0 && (
                              <p className="text-xs italic">Aucune habitude programmée</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="completionRate" 
                    fill="#4f46e5" 
                    name="Habitudes complétées"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 