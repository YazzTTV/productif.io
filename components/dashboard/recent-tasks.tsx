"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, ArrowRight, Edit } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface TaskWithProject {
  id: string
  title: string
  description: string | null
  priority: number | null
  energyLevel: number | null
  dueDate: Date | null
  completed: boolean
  project: {
    id: string
    name: string
  } | null
}

const priorityLabels: Record<number, { label: string, color: string }> = {
  0: { label: "Quick Win", color: "bg-green-100 text-green-800" },
  1: { label: "Urgent", color: "bg-red-100 text-red-800" },
  2: { label: "Important", color: "bg-yellow-100 text-yellow-800" },
  3: { label: "A faire", color: "bg-blue-100 text-blue-800" },
  4: { label: "Optionnel", color: "bg-gray-100 text-gray-800" }
}

const energyLabels: Record<number, { label: string, color: string }> = {
  0: { label: "Extrême", color: "bg-red-100 text-red-800" },
  1: { label: "Élevé", color: "bg-orange-100 text-orange-800" },
  2: { label: "Moyen", color: "bg-yellow-100 text-yellow-800" },
  3: { label: "Faible", color: "bg-green-100 text-green-800" }
}

export function RecentTasks() {
  const [tasks, setTasks] = useState<TaskWithProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch("/api/tasks/today")
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des tâches")
        }
        const data = await response.json()
        setTasks(data)
      } catch (error) {
        console.error("Erreur:", error)
        setError("Impossible de charger les tâches. Veuillez réessayer plus tard.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchTasks()
  }, [])

  function formatDate(date: Date) {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
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
        <CardHeader className="pb-3">
          <CardTitle>Tâches d'aujourd'hui</CardTitle>
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
        <CardHeader className="pb-3">
          <CardTitle>Tâches d'aujourd'hui</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune tâche pour aujourd'hui</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Tâches d'aujourd'hui ({tasks.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={`bg-white rounded-lg shadow p-4 ${task.completed ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Link href={`/dashboard/tasks/${task.id}/edit`}>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="flex gap-2">
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
                  <span>
                    Échéance : {format(new Date(task.dueDate), "d MMMM yyyy", { locale: fr })}
                  </span>
                )}
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Link href="/dashboard/tasks">
              <Button variant="ghost" className="w-full justify-between">
                Voir toutes les tâches
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

