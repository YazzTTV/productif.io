"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  dueDate: string | null
  priority: number | null
  energyLevel: number | null
  projectId: string | null
  projectName: string | null
  createdAt: string
  updatedAt: string
}

export default function ViewUserTasksPage() {
  const params = useParams()
  const userId = params.userId as string
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | "todo" | "done">("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Récupérer les informations de l'utilisateur
        const userResponse = await fetch(`/api/users/${userId}`)
        if (!userResponse.ok) {
          throw new Error("Impossible de récupérer les informations de l'utilisateur")
        }
        const userData = await userResponse.json()
        setUserData(userData.user)
        
        // Récupérer les tâches de l'utilisateur
        const tasksResponse = await fetch(`/api/users/${userId}/tasks`)
        if (!tasksResponse.ok) {
          throw new Error("Impossible de récupérer les tâches de l'utilisateur")
        }
        const tasksData = await tasksResponse.json()
        setTasks(tasksData.tasks || [])
        
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error)
        setError("Impossible de récupérer les données de l'utilisateur")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [userId])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  // Filtrer les tâches en fonction du statut
  const filteredTasks = tasks.filter(task => {
    if (filterStatus === "all") return true
    if (filterStatus === "done") return task.completed
    if (filterStatus === "todo") return !task.completed
    return true
  })
  
  // Regrouper les tâches par projet
  const tasksByProject: Record<string, Task[]> = {}
  filteredTasks.forEach(task => {
    const projectKey = task.projectId ? task.projectId : "no-project"
    if (!tasksByProject[projectKey]) {
      tasksByProject[projectKey] = []
    }
    tasksByProject[projectKey].push(task)
  })
  
  // Fonctions utilitaires pour le rendu
  const getPriorityLabel = (priority: number | null) => {
    if (priority === null) return ""
    switch (priority) {
      case 0: return "P0 - Quick Win"
      case 1: return "P1 - Urgent"
      case 2: return "P2 - Important"
      case 3: return "P3 - Peut attendre"
      default: return `P${priority}`
    }
  }
  
  const getPriorityBadge = (priority: number | null) => {
    if (priority === null) return null
    
    const colors: Record<number, string> = {
      0: "bg-red-100 text-red-800",
      1: "bg-orange-100 text-orange-800",
      2: "bg-yellow-100 text-yellow-800",
      3: "bg-green-100 text-green-800"
    }
    
    return (
      <Badge className={`${colors[priority] || "bg-slate-100"}`}>
        P{priority}
      </Badge>
    )
  }
  
  const getStatusBadge = (completed: boolean) => {
    return completed ? (
      <Badge className="bg-green-100 text-green-800">Terminé</Badge>
    ) : (
      <Badge className="bg-slate-100 text-slate-800">À faire</Badge>
    )
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Tâches de {userData?.name || userData?.email || "l'utilisateur"}
      </h1>
      <p className="text-muted-foreground mb-6">
        Suivi des tâches assignées
      </p>
      
      <div className="mb-6">
        <Tabs defaultValue="all" onValueChange={(value) => setFilterStatus(value as any)}>
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="todo">À faire</TabsTrigger>
            <TabsTrigger value="done">Terminées</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Aucune tâche ne correspond aux critères sélectionnés
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Tâches sans projet */}
          {tasksByProject["no-project"] && tasksByProject["no-project"].length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tâches sans projet</CardTitle>
                <CardDescription>
                  Tâches qui ne sont pas associées à un projet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasksByProject["no-project"].map(task => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-muted-foreground mt-1">{task.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(task.priority)}
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy", { locale: fr }) : "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(task.completed)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          
          {/* Tâches par projet */}
          {Object.entries(tasksByProject).map(([projectKey, projectTasks]) => {
            if (projectKey === "no-project") return null
            
            // Utiliser la première tâche pour obtenir les infos du projet
            const projectName = projectTasks[0]?.projectName || "Projet inconnu"
            
            return (
              <Card key={projectKey}>
                <CardHeader>
                  <CardTitle>{projectName}</CardTitle>
                  <CardDescription>
                    {projectTasks.length} tâche{projectTasks.length > 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectTasks.map(task => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div className="font-medium">{task.title}</div>
                            {task.description && (
                              <div className="text-xs text-muted-foreground mt-1">{task.description}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(task.priority)}
                          </TableCell>
                          <TableCell>
                            {task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy", { locale: fr }) : "-"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(task.completed)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 