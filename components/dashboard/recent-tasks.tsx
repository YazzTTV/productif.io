"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Clock, ArrowRight, Edit, RefreshCcw, CalendarDays } from "lucide-react"
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { safeJsonResponse } from "@/lib/api-utils"

interface TaskWithProject {
  id: string
  title: string
  description: string | null
  priority: number | null
  energyLevel: number | null
  dueDate: Date | null
  scheduledFor: Date | null
  completed: boolean
  project: {
    id: string
    name: string
  } | null
}

const priorityLabels: Record<number, { label: string, color: string }> = {
  0: { label: "Optionnel", color: "bg-gray-100 text-gray-800" },
  1: { label: "A faire", color: "bg-blue-100 text-blue-800" },
  2: { label: "Important", color: "bg-yellow-100 text-yellow-800" },
  3: { label: "Urgent", color: "bg-red-100 text-red-800" },
  4: { label: "Quick Win", color: "bg-green-100 text-green-800" }
}

const energyLabels: Record<number, { label: string, color: string }> = {
  0: { label: "Faible", color: "bg-green-100 text-green-800" },
  1: { label: "Moyen", color: "bg-yellow-100 text-yellow-800" },
  2: { label: "Élevé", color: "bg-orange-100 text-orange-800" },
  3: { label: "Extrême", color: "bg-red-100 text-red-800" }
}

export function RecentTasks() {
  const [tasks, setTasks] = useState<TaskWithProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const fetchTasks = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/tasks/today")
      const data = await safeJsonResponse(response, "tasks/today")
      
      // Convertir les dates
      const formattedData = Array.isArray(data) ? data.map(task => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        scheduledFor: task.scheduledFor ? new Date(task.scheduledFor) : null
      })) : [];
      
      setTasks(formattedData)
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue")
      console.error("Erreur lors de la récupération des tâches:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    setIsUpdating(taskId)
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: taskId,
          completed: !completed
        })
      })

      await safeJsonResponse(response, "tasks/update")

      // Mise à jour locale de l'état pour un rendu immédiat
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, completed: !completed } : task
        )
      )
      
      // Rafraîchir les données après un court délai
      setTimeout(() => {
        fetchTasks()
      }, 500)
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error)
    } finally {
      setIsUpdating(null)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  function formatDate(date: Date) {
    if (isToday(date)) {
      return "Aujourd'hui";
    }
    if (isTomorrow(date)) {
      return "⚠️ Demain";
    }
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle>Tâches d'aujourd'hui</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle>Tâches d'aujourd'hui</CardTitle>
          <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchTasks}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <RefreshCcw className="h-4 w-4" />
        </motion.button>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle>Tâches d'aujourd'hui</CardTitle>
          <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchTasks}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <RefreshCcw className="h-4 w-4" />
        </motion.button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune tâche pour aujourd'hui</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const completedCount = tasks.filter(task => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle>
          Tâches d'aujourd'hui ({pendingCount} en attente, {completedCount} terminées)
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchTasks}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={cn(
                "bg-white rounded-lg shadow p-4 transition-opacity", 
                task.completed ? 'opacity-60' : ''
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-0 h-auto mt-0.5 bg-transparent border-none cursor-pointer"
                    onClick={() => toggleTaskCompletion(task.id, task.completed)}
                    disabled={isUpdating === task.id}
                  >
                    {isUpdating === task.id ? (
                      <RefreshCcw className="h-5 w-5 text-gray-400 animate-spin" />
                    ) : task.completed ? (
                      <CheckCircle className="h-5 w-5 text-[#00C27A]" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                  </motion.button>
                  <div>
                    <h3 className={cn(
                      "font-medium", 
                      task.completed ? 'line-through text-gray-500' : ''
                    )}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link href={`/dashboard/tasks/${task.id}/edit`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="h-8 w-8 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </motion.button>
                  </Link>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {task.priority !== null && priorityLabels[task.priority] && (
                      <Badge className={priorityLabels[task.priority].color}>
                        {priorityLabels[task.priority].label}
                      </Badge>
                    )}
                    {task.energyLevel !== null && energyLabels[task.energyLevel] && (
                      <Badge className={energyLabels[task.energyLevel].color}>
                        {energyLabels[task.energyLevel].label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                {task.project && (
                  <Badge variant="outline">
                    {task.project.name}
                  </Badge>
                )}
                {task.dueDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(task.dueDate)}
                  </span>
                )}
                {!task.dueDate && task.scheduledFor && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Planifiée: {formatDate(task.scheduledFor)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <Link href="/dashboard/tasks">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-xl shadow-sm flex items-center gap-2 mx-auto"
            >
              <span>Toutes les tâches</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

