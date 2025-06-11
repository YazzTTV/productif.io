"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { format, addDays, startOfDay, isToday } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LeaderboardCompact } from "@/components/gamification/leaderboard-compact"

interface DashboardMetrics {
  habits: {
    today: number
    completed: number
    completionRate: number
    streak: number
  }
  tasks: {
    today: number
    completed: number
    completionRate: number
  }
  productivity: {
    score: number
    trend: string
    change: number
  }
}

interface GamificationStats {
  totalPoints: number
  level: number
  currentStreak: number
  longestStreak: number
  totalHabitsCompleted: number
  pointsToNextLevel: number
}

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
  children?: React.ReactNode
}

function CircularProgress({ 
  percentage, 
  size = 200, 
  strokeWidth = 12, 
  color = "#10B981",
  children 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

interface MiniCircleProps {
  value: number
  label: string
  unit?: string
  color?: string
  maxValue?: number
}

function MiniCircle({ value, label, unit = "", color = "#10B981", maxValue = 100 }: MiniCircleProps) {
  const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0
  
  return (
    <div className="flex flex-col items-center space-y-2">
      <CircularProgress
        percentage={percentage}
        size={80}
        strokeWidth={6}
        color={color}
      >
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{unit}</div>
        </div>
      </CircularProgress>
      <div className="text-sm font-medium text-gray-700 text-center">
        {label}
      </div>
    </div>
  )
}

export function FitbitMobileDashboard() {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [gamificationStats, setGamificationStats] = useState<GamificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchMetrics = async (date?: Date) => {
    try {
      const targetDate = date || selectedDate
      const formattedDate = targetDate.toISOString().split('T')[0] // Format YYYY-MM-DD
      
      const [metricsResponse, gamificationResponse] = await Promise.all([
        fetch(`/api/dashboard/metrics?date=${formattedDate}`),
        fetch("/api/gamification/stats")
      ])
      
      if (!metricsResponse.ok) throw new Error("Erreur lors du chargement des métriques")
      if (!gamificationResponse.ok) throw new Error("Erreur lors du chargement des stats de gamification")
      
      const metricsData = await metricsResponse.json()
      const gamificationData = await gamificationResponse.json()
      
      setMetrics(metricsData)
      setGamificationStats(gamificationData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [selectedDate])

  const handlePreviousDay = () => {
    const newDate = addDays(selectedDate, -1)
    setSelectedDate(newDate)
    fetchMetrics(newDate)
  }

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1)
    setSelectedDate(newDate)
    fetchMetrics(newDate)
  }

  const handleToday = () => {
    const today = startOfDay(new Date())
    setSelectedDate(today)
    fetchMetrics(today)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  const completionRate = metrics?.habits.completionRate || 0
  const realStreak = gamificationStats?.currentStreak || 0
  const completedHabits = metrics?.habits.completed || 0
  const totalHabits = metrics?.habits.today || 0
  const remainingTasks = (metrics?.tasks.today || 0) - (metrics?.tasks.completed || 0)
  const taskCompletionRate = metrics?.tasks.completionRate || 0

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header avec navigation temporelle */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousDay}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {isToday(selectedDate) ? "Aujourd'hui" : format(selectedDate, "EEEE", { locale: fr })}
            </div>
            {!isToday(selectedDate) && (
              <div className="text-sm text-gray-500">
                {format(selectedDate, "d MMMM yyyy", { locale: fr })}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            className="h-8 w-8"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* Grand cercle de progression principal */}
        <div className="flex flex-col items-center space-y-4">
          <CircularProgress
            percentage={completionRate}
            size={240}
            strokeWidth={16}
            color={completionRate >= 75 ? "#10B981" : completionRate >= 50 ? "#F59E0B" : "#EF4444"}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {completionRate}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {completedHabits}/{totalHabits}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Habitudes
              </div>
            </div>
          </CircularProgress>

          {/* Bouton retour à aujourd'hui */}
          {!isToday(selectedDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="text-green-600 hover:text-green-700"
            >
              Retour à aujourd'hui
            </Button>
          )}
        </div>

                 {/* Mini-cercles de métriques */}
         <div className="grid grid-cols-4 gap-2 px-2">
           <MiniCircle
             value={realStreak}
             label="Streak"
             unit="jours"
             color="#8B5CF6"
             maxValue={30}
           />
           <MiniCircle
             value={completedHabits}
             label="Habitudes"
             color="#10B981"
             maxValue={totalHabits || 10}
           />
           <MiniCircle
             value={remainingTasks}
             label="Tâches"
             unit="restantes"
             color="#F59E0B"
             maxValue={Math.max(remainingTasks, 10)}
           />
           <MiniCircle
             value={metrics?.productivity?.score || 0}
             label="Score"
             color="#3B82F6"
             maxValue={100}
           />
         </div>

                 {/* Section Habitudes et Tâches */}
         <div className="space-y-4 mx-2">
           {/* Habitudes d'aujourd'hui */}
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-semibold text-gray-900">
                   Habitudes d'aujourd'hui
                 </h2>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => router.push("/dashboard/habits")}
                   className="text-green-600 hover:text-green-700"
                 >
                   Voir tout
                 </Button>
               </div>

               <div className="space-y-3">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-gray-600">Progression</span>
                   <span className="font-medium text-gray-900">
                     {completedHabits}/{totalHabits}
                   </span>
                 </div>
                 
                 {/* Barre de progression horizontale */}
                 <div className="w-full bg-gray-200 rounded-full h-3">
                   <div 
                     className="h-3 rounded-full transition-all duration-500 bg-green-500"
                     style={{ width: `${completionRate}%` }}
                   />
                 </div>

                 <div className="text-center">
                   <Button
                     onClick={() => router.push("/dashboard/habits")}
                     className="w-full bg-green-500 hover:bg-green-600 text-white"
                   >
                     Gérer mes habitudes
                   </Button>
                 </div>
               </div>
             </CardContent>
           </Card>

           {/* Tâches d'aujourd'hui */}
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-semibold text-gray-900">
                   Tâches d'aujourd'hui
                 </h2>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => router.push("/dashboard/tasks")}
                   className="text-green-600 hover:text-green-700"
                 >
                   Voir tout
                 </Button>
               </div>

               <div className="space-y-3">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-gray-600">Restantes</span>
                   <span className="font-medium text-gray-900">
                     {remainingTasks} tâches
                   </span>
                 </div>
                 
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-gray-600">Progression</span>
                   <span className="font-medium text-gray-900">
                     {metrics?.tasks.completed || 0}/{metrics?.tasks.today || 0}
                   </span>
                 </div>
                 
                 {/* Barre de progression horizontale */}
                 <div className="w-full bg-gray-200 rounded-full h-3">
                   <div 
                     className="h-3 rounded-full transition-all duration-500 bg-green-500"
                     style={{ width: `${taskCompletionRate}%` }}
                   />
                 </div>

                 <div className="text-center">
                   <Button
                     onClick={() => router.push("/dashboard/tasks")}
                     className="w-full bg-green-500 hover:bg-green-600 text-white"
                   >
                     Gérer mes tâches
                   </Button>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>

         {/* Section Classement */}
         <div className="mx-2">
           <LeaderboardCompact />
         </div>

        {/* Section Historique récent */}
        <Card className="mx-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Progrès récent
              </h2>
            </div>

                         <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-sm text-gray-600">Streak actuel</span>
                 <span className="text-lg font-bold text-purple-600">
                   {realStreak} jours
                 </span>
               </div>
               
               <div className="flex items-center justify-between">
                 <span className="text-sm text-gray-600">Tâches restantes</span>
                 <span className="text-lg font-bold text-orange-500">
                   {remainingTasks}
                 </span>
               </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Score productivité</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-orange-500">
                    {metrics?.productivity?.score || 0}
                  </span>
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    metrics?.productivity?.trend === "up" 
                      ? "bg-green-100 text-green-600" 
                      : "bg-red-100 text-red-600"
                  )}>
                    {metrics?.productivity?.trend === "up" ? "↗" : "↘"} 
                    {Math.abs(metrics?.productivity?.change || 0)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      
    </div>
  )
} 