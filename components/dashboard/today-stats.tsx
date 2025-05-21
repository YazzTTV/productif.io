"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ListTodo, AlertCircle } from "lucide-react"
import { formatInTimezone, USER_TIMEZONE } from "@/lib/date-utils"
import { toZonedTime } from "date-fns-tz"
import { startOfDay, isBefore } from "date-fns"

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

interface Task {
  id: string
  title: string
  completed: boolean
  dueDate?: string | null
  scheduledFor?: string | null
}

export function TodayStats() {
  const [todayStats, setTodayStats] = useState<TodayStats>({ total: 0, completed: 0, overdue: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // Récupérer les tâches du jour via l'API
        const response = await fetch("/api/tasks/today")
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des statistiques")
        }
        const tasks = await response.json() as Task[]
        
        // Vérifier si des tâches de demain ont été incluses
        const now = new Date()
        const todayInUserTz = toZonedTime(now, USER_TIMEZONE)
        const startOfTodayUserTz = new Date(
          todayInUserTz.getFullYear(),
          todayInUserTz.getMonth(),
          todayInUserTz.getDate(),
          0, 0, 0
        )
        
        const startOfTomorrowUserTz = new Date(
          todayInUserTz.getFullYear(),
          todayInUserTz.getMonth(),
          todayInUserTz.getDate() + 1,
          0, 0, 0
        )
        
        // Filtrer uniquement les tâches qui sont vraiment pour aujourd'hui (ou avant)
        const filteredTasks = tasks.filter((task: Task) => {
          if (!task.dueDate && !task.scheduledFor) return true // Tâches sans date
          
          const dueDate = task.dueDate ? toZonedTime(new Date(task.dueDate), USER_TIMEZONE) : null
          const scheduledFor = task.scheduledFor ? toZonedTime(new Date(task.scheduledFor), USER_TIMEZONE) : null
          
          // Une tâche est pour aujourd'hui si:
          // - Sa date d'échéance est avant demain
          // - ou sa date planifiée est avant demain
          return (dueDate && dueDate < startOfTomorrowUserTz) || 
                 (scheduledFor && scheduledFor < startOfTomorrowUserTz)
        })
        
        // Récupérer le nombre de tâches en retard
        const overdueTasks = filteredTasks.filter((task: Task) => {
          if (!task.dueDate || task.completed) return false
          
          const dueDate = toZonedTime(new Date(task.dueDate), USER_TIMEZONE)
          return isBefore(dueDate, startOfTodayUserTz)
        })
        
        // Mettre à jour les statistiques
        setTodayStats({
          total: filteredTasks.length,
          completed: filteredTasks.filter((t: Task) => t.completed).length,
          overdue: overdueTasks.length
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