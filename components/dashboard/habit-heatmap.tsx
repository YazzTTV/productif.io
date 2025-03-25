"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addDays, format, isSameDay, subDays } from "date-fns"
import { fr } from "date-fns/locale"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HabitHeatmapProps {
  className?: string
}

interface HeatmapData {
  date: string
  count: number
  percentage: number
  habits: {
    name: string
    completed: boolean
  }[]
}

export function HabitHeatmap({ className }: HabitHeatmapProps) {
  const [data, setData] = useState<Record<string, HeatmapData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [daysToShow] = useState<Date[]>([])

  // Préparer les 30 derniers jours
  useEffect(() => {
    const days = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      days.push(subDays(today, i))
    }
    
    // Mettre à jour l'état
    daysToShow.length = 0
    daysToShow.push(...days)
  }, [daysToShow])

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/habits/history")
        
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des données")
        }
        
        const habitData = await response.json()
        setData(habitData)
      } catch (error) {
        console.error("Erreur:", error)
        
        // Générer des données fictives pour le développement
        const mockData: Record<string, HeatmapData> = {}
        
        daysToShow.forEach(date => {
          const dateStr = format(date, "yyyy-MM-dd")
          const randomCount = Math.floor(Math.random() * 5)
          const totalHabits = Math.floor(Math.random() * 5) + randomCount
          
          mockData[dateStr] = {
            date: dateStr,
            count: randomCount,
            percentage: totalHabits > 0 ? Math.round((randomCount / totalHabits) * 100) : 0,
            habits: Array(totalHabits).fill(0).map((_, i) => ({
              name: `Habitude ${i + 1}`,
              completed: i < randomCount
            }))
          }
        })
        
        setData(mockData)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (daysToShow.length > 0) {
      fetchData()
    }
  }, [daysToShow])

  // Calculer l'intensité de la couleur en fonction du pourcentage
  const getColorIntensity = (percentage: number) => {
    if (percentage === 0) return "bg-gray-100"
    if (percentage < 25) return "bg-green-100"
    if (percentage < 50) return "bg-green-200"
    if (percentage < 75) return "bg-green-300"
    if (percentage < 100) return "bg-green-400"
    return "bg-green-500"
  }

  // Formater un jour pour l'affichage
  const formatDay = (date: Date) => {
    return format(date, "d", { locale: fr })
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Suivi des habitudes (30 jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="flex space-x-1">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="h-8 w-8 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="flex space-x-1">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="h-8 w-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Organiser les jours par semaines pour l'affichage
  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  daysToShow.forEach(day => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(day)
  })

  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Suivi des habitudes (30 jours)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex space-x-1">
              {week.map(day => {
                const dateStr = format(day, "yyyy-MM-dd")
                const dayData = data[dateStr] || { percentage: 0, count: 0, habits: [] }
                
                return (
                  <TooltipProvider key={dateStr}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                            w-8 h-8 rounded-sm flex items-center justify-center text-xs
                            ${getColorIntensity(dayData.percentage)}
                            ${isSameDay(day, new Date()) ? "ring-2 ring-blue-500" : ""}
                          `}
                        >
                          {formatDay(day)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="p-2 space-y-1">
                        <p className="font-medium">{format(day, "EEEE d MMMM", { locale: fr })}</p>
                        <p>{dayData.count} habitudes complétées sur {dayData.habits.length}</p>
                        
                        {dayData.habits.length > 0 ? (
                          <ul className="text-sm mt-1">
                            {dayData.habits.map((habit, i) => (
                              <li key={i} className="flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-1 ${habit.completed ? "bg-green-500" : "bg-gray-300"}`}></span>
                                <span>{habit.name}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">Aucune habitude ce jour</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex justify-end">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Moins</span>
            <div className="w-4 h-4 rounded-sm bg-gray-100"></div>
            <div className="w-4 h-4 rounded-sm bg-green-100"></div>
            <div className="w-4 h-4 rounded-sm bg-green-200"></div>
            <div className="w-4 h-4 rounded-sm bg-green-300"></div>
            <div className="w-4 h-4 rounded-sm bg-green-400"></div>
            <div className="w-4 h-4 rounded-sm bg-green-500"></div>
            <span className="text-xs text-gray-500">Plus</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 