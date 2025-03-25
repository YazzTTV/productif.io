"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ListTodo, AlertCircle } from "lucide-react"

interface TodayStats {
  total: number
  completed: number
  overdue: number
}

interface StatItem {
  name: string
  value: number | string
  icon: React.ElementType
  color: string
  bgColor: string
}

export function TodayStats() {
  const [todayStats, setTodayStats] = useState<TodayStats>({ total: 0, completed: 0, overdue: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/tasks/today")
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des statistiques")
        }
        const tasks = await response.json()
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        setTodayStats({
          total: tasks.length,
          completed: tasks.filter((t: any) => t.completed).length,
          overdue: tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < today).length
        })
      } catch (error) {
        console.error("Erreur:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const stats: StatItem[] = [
    {
      name: "Tâches du jour",
      value: isLoading ? "-" : todayStats.total,
      icon: ListTodo,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      name: "Terminées",
      value: isLoading ? "-" : todayStats.completed,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      name: "En retard",
      value: isLoading ? "-" : todayStats.overdue,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.name}
            </CardTitle>
            <div className={`${stat.bgColor} p-2 rounded-full`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 