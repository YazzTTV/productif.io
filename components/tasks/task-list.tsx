"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Trash2, CheckCircle2, Circle, Edit, PlayCircle } from "lucide-react"
import { formatDistanceToNow, format, isToday, isTomorrow, isThisWeek, startOfToday } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"

interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  dueDate: Date | null
  priority: number | null
  energyLevel: number | null
  projectId: string | null
  project: {
    id: string
    name: string
  } | null
}

interface TaskListProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, data: Partial<Task>) => Promise<void>
  onTaskDelete: (taskId: string) => Promise<void>
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

export function TaskList({ tasks: initialTasks = [], onTaskUpdate, onTaskDelete }: TaskListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const handleTaskUpdate = async (taskId: string, data: Partial<Task>) => {
    try {
      await onTaskUpdate(taskId, data)
      
      // Si la tâche est marquée comme complétée, la supprimer de la liste locale
      if (data.completed === true) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
      }
      
      toast({
        title: "Succès",
        description: "La tâche a été mise à jour",
      })
      router.refresh()
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche",
        variant: "destructive",
      })
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    try {
      await onTaskDelete(taskId)
      toast({
        title: "Succès",
        description: "La tâche a été supprimée",
      })
      router.refresh()
    } catch (error) {
      console.error("Erreur lors de la suppression de la tâche:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      })
    }
  }

  const formatDueDate = (date: Date | null) => {
    if (!date) return null
    
    const dueDate = new Date(date)
    if (isToday(dueDate)) {
      return "Aujourd'hui"
    }
    if (isTomorrow(dueDate)) {
      return "Demain"
    }
    if (isThisWeek(dueDate, { weekStartsOn: 1 })) {
      return format(dueDate, "EEEE", { locale: fr })
    }
    return format(date, "d MMMM yyyy", { locale: fr })
  }

  const groupTasks = (tasks: Task[] = []) => {
    const today = startOfToday()

    const initialGroups = {
      noDueDate: [] as Task[],
      overdue: [] as Task[],
      today: [] as Task[],
      tomorrow: [] as Task[],
      thisWeek: [] as Task[],
      later: [] as Task[],
    }

    const sortedGroups = tasks.reduce((groups, task) => {
      if (!task.dueDate) {
        groups.noDueDate.push(task)
      } else {
        const dueDate = new Date(task.dueDate)
        if (dueDate < today) {
          groups.overdue.push(task)
        } else if (isToday(dueDate)) {
          groups.today.push(task)
        } else if (isTomorrow(dueDate)) {
          groups.tomorrow.push(task)
        } else if (isThisWeek(dueDate, { weekStartsOn: 1 })) {
          groups.thisWeek.push(task)
        } else {
          groups.later.push(task)
        }
      }
      return groups
    }, initialGroups)

    // Fonction de tri: non complétée d'abord, puis priorité (4->0), puis énergie (3->0), puis échéance
    const comparator = (a: Task, b: Task) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }

      const pa = a.priority ?? -1
      const pb = b.priority ?? -1
      if (pa !== pb) {
        return pb - pa
      }

      const ea = a.energyLevel ?? -1
      const eb = b.energyLevel ?? -1
      if (ea !== eb) {
        return eb - ea
      }

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return 0
    }

    sortedGroups.noDueDate.sort(comparator)
    sortedGroups.overdue.sort(comparator)
    sortedGroups.today.sort(comparator)
    sortedGroups.tomorrow.sort(comparator)
    sortedGroups.thisWeek.sort(comparator)
    sortedGroups.later.sort(comparator)

    return sortedGroups
  }

  const groupedTasks = groupTasks(tasks)

  const renderTaskGroup = (title: string, tasks: Task[], showDate = true) => {
    if (tasks.length === 0) return null

    return (
      <div className="mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{title}</h2>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start justify-between p-3 sm:p-4 rounded-lg border ${
                task.completed ? "bg-gray-50" : "bg-white"
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4 flex-1">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => {
                    handleTaskUpdate(task.id, { completed: checked as boolean })
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${task.completed ? "line-through text-gray-500" : ""}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={`text-sm mt-1 line-clamp-2 ${task.completed ? "text-gray-400" : "text-gray-600"}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {task.priority !== null && (
                          <Badge variant="outline" className={`text-xs ${priorityLabels[task.priority]?.color}`}>
                            {priorityLabels[task.priority]?.label}
                          </Badge>
                        )}
                        {task.energyLevel !== null && (
                          <Badge variant="outline" className={`text-xs ${energyLabels[task.energyLevel]?.color}`}>
                            {energyLabels[task.energyLevel]?.label}
                          </Badge>
                        )}
                        {task.project && (
                          <Badge variant="outline" className="text-xs">
                            {task.project.name}
                          </Badge>
                        )}
                        {showDate && task.dueDate && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-500">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {formatDueDate(task.dueDate)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 mt-3 sm:mt-0 ml-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/dashboard/time?taskId=${task.id}&title=${encodeURIComponent(task.title)}`)}
                      >
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/dashboard/tasks/${task.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleTaskDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {renderTaskGroup("En retard", groupedTasks.overdue)}
      {renderTaskGroup("Aujourd'hui", groupedTasks.today)}
      {renderTaskGroup("Demain", groupedTasks.tomorrow)}
      {renderTaskGroup("Cette semaine", groupedTasks.thisWeek)}
      {renderTaskGroup("Plus tard", groupedTasks.later)}
      {renderTaskGroup("Sans date", groupedTasks.noDueDate, false)}
    </div>
  )
}

