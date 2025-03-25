"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns/esm"
import { fr } from "date-fns/locale/fr"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string | null
  status: "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: Date | null
  createdAt: Date
  project: {
    id: string
    name: string
    color: string | null
  } | null
}

interface TasksTableProps {
  tasks: Task[]
}

export function TasksTable({ tasks: initialTasks }: TasksTableProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  async function toggleTaskStatus(taskId: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === "DONE" ? "TODO" : "DONE"

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la tâche")
      }

      // Mettre à jour l'état local
      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  async function deleteTask(taskId: string) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la tâche")
      }

      // Mettre à jour l'état local
      setTasks(tasks.filter((task) => task.id !== taskId))
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "LOW":
        return "bg-blue-100 text-blue-800"
      case "MEDIUM":
        return "bg-green-100 text-green-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "URGENT":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "DONE":
        return "bg-green-100 text-green-800"
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  function formatDate(date: Date | null) {
    if (!date) return "-"
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Priorité</TableHead>
            <TableHead>Projet</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Créée</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                Aucune tâche trouvée. Créez votre première tâche !
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Checkbox
                    checked={task.status === "DONE"}
                    onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/tasks/${task.id}`}
                    className={`font-medium hover:underline ${task.status === "DONE" ? "line-through text-gray-500" : ""}`}
                  >
                    {task.title}
                  </Link>
                  {task.description && <p className="text-sm text-gray-500 truncate max-w-xs">{task.description}</p>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.project ? (
                    <div className="flex items-center">
                      <div
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: task.project.color || "#6366F1" }}
                      />
                      <span>{task.project.name}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{formatDate(task.dueDate)}</TableCell>
                <TableCell>{formatDate(task.createdAt)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/tasks/${task.id}/edit`)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteTask(task.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

