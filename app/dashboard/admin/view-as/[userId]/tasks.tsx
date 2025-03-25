"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckSquare, Info, Clock, Filter } from "lucide-react"
import { format, isAfter, isBefore, isToday } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  dueDate: string | null
  priority: number | null
  energyLevel: number | null
  createdAt: string
  updatedAt: string
  projectId: string | null
  projectName: string | null
}

export default function TasksPage() {
  const params = useParams()
  const userId = params.userId as string
  const [isLoading, setIsLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all')

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${userId}/tasks`)
        if (!response.ok) {
          throw new Error("Impossible de récupérer les tâches")
        }
        const data = await response.json()
        setTasks(data.tasks || [])
      } catch (error) {
        console.error("Erreur lors de la récupération des tâches:", error)
        setError("Impossible de récupérer les tâches de l'utilisateur")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTasks()
  }, [userId])
  
  useEffect(() => {
    // Filtrer les tâches en fonction du filtre sélectionné
    const now = new Date()
    
    let filtered = [...tasks]
    switch (filter) {
      case 'today':
        filtered = tasks.filter(task => 
          !task.completed && task.dueDate && isToday(new Date(task.dueDate))
        )
        break
      case 'upcoming':
        filtered = tasks.filter(task => 
          !task.completed && task.dueDate && isAfter(new Date(task.dueDate), now) && !isToday(new Date(task.dueDate))
        )
        break
      case 'overdue':
        filtered = tasks.filter(task => 
          !task.completed && task.dueDate && isBefore(new Date(task.dueDate), now) && !isToday(new Date(task.dueDate))
        )
        break
      case 'completed':
        filtered = tasks.filter(task => task.completed)
        break
      default:
        // 'all' - pas de filtrage supplémentaire
        break
    }
    
    // Tri par priorité (les priorités les plus hautes d'abord) puis par date d'échéance
    filtered.sort((a, b) => {
      // Tâches sans priorité en dernier
      if (a.priority === null && b.priority !== null) return 1
      if (a.priority !== null && b.priority === null) return -1
      
      // Tri par priorité (ordre croissant car P0 est plus important que P3)
      if (a.priority !== b.priority) {
        return (a.priority || 0) - (b.priority || 0)
      }
      
      // Tâches sans date d'échéance en dernier
      if (!a.dueDate && b.dueDate) return 1
      if (a.dueDate && !b.dueDate) return -1
      
      // Tri par date d'échéance
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      
      return 0
    })
    
    setFilteredTasks(filtered)
  }, [tasks, filter])
  
  const getPriorityLabel = (priority: number | null) => {
    if (priority === null) return null
    switch(priority) {
      case 0: return "P0 - Critique"
      case 1: return "P1 - Haute"
      case 2: return "P2 - Moyenne"
      case 3: return "P3 - Basse"
      default: return `P${priority}`
    }
  }
  
  const getPriorityColor = (priority: number | null) => {
    if (priority === null) return "bg-gray-100 text-gray-800"
    switch(priority) {
      case 0: return "bg-red-100 text-red-800"
      case 1: return "bg-orange-100 text-orange-800"
      case 2: return "bg-blue-100 text-blue-800"
      case 3: return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }
  
  const getStatusLabel = (task: Task) => {
    if (task.completed) return "Terminée"
    if (!task.dueDate) return "Sans date"
    
    const dueDate = new Date(task.dueDate)
    const now = new Date()
    
    if (isToday(dueDate)) return "Aujourd'hui"
    if (isBefore(dueDate, now)) return "En retard"
    return "À venir"
  }
  
  const getStatusColor = (task: Task) => {
    if (task.completed) return "bg-green-100 text-green-800"
    if (!task.dueDate) return "bg-gray-100 text-gray-800"
    
    const dueDate = new Date(task.dueDate)
    const now = new Date()
    
    if (isToday(dueDate)) return "bg-yellow-100 text-yellow-800"
    if (isBefore(dueDate, now)) return "bg-red-100 text-red-800"
    return "bg-blue-100 text-blue-800"
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
  
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckSquare className="h-24 w-24 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Aucune tâche trouvée</h2>
        <p className="text-muted-foreground">
          Cet utilisateur n'a pas encore créé de tâches
        </p>
      </div>
    )
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tâches de l'utilisateur</h1>
      
      <Tabs defaultValue="list" className="w-full mb-6">
        <TabsList>
          <TabsTrigger value="list">
            <CheckSquare className="mr-2 h-4 w-4" />
            Liste des tâches
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Info className="mr-2 h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des tâches</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={filter === 'all' ? 'secondary' : 'outline'} 
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    Toutes
                  </Button>
                  <Button 
                    variant={filter === 'today' ? 'secondary' : 'outline'} 
                    size="sm"
                    onClick={() => setFilter('today')}
                  >
                    Aujourd'hui
                  </Button>
                  <Button 
                    variant={filter === 'upcoming' ? 'secondary' : 'outline'} 
                    size="sm"
                    onClick={() => setFilter('upcoming')}
                  >
                    À venir
                  </Button>
                  <Button 
                    variant={filter === 'overdue' ? 'secondary' : 'outline'} 
                    size="sm"
                    onClick={() => setFilter('overdue')}
                  >
                    En retard
                  </Button>
                  <Button 
                    variant={filter === 'completed' ? 'secondary' : 'outline'} 
                    size="sm"
                    onClick={() => setFilter('completed')}
                  >
                    Terminées
                  </Button>
                </div>
              </div>
              <CardDescription>
                {filteredTasks.length} tâche(s) {filter !== 'all' ? `(filtre: ${filter})` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTasks.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Aucune tâche ne correspond à ce filtre</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map(task => (
                    <div key={task.id} className="border rounded-md p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{task.title}</h3>
                            <Badge className={getStatusColor(task)}>
                              {getStatusLabel(task)}
                            </Badge>
                            {task.priority !== null && (
                              <Badge className={getPriorityColor(task.priority)}>
                                {getPriorityLabel(task.priority)}
                              </Badge>
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {task.dueDate && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(new Date(task.dueDate), "d MMMM yyyy", { locale: fr })}
                              </div>
                            )}
                            
                            {task.projectName && (
                              <div>
                                Projet: {task.projectName}
                              </div>
                            )}
                            
                            {task.energyLevel !== null && (
                              <div>
                                Énergie: {task.energyLevel}/5
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques des tâches</CardTitle>
              <CardDescription>
                Vue d'ensemble des tâches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Par statut</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Terminées</span>
                        <span className="text-sm">{tasks.filter(t => t.completed).length}</span>
                      </div>
                      <Progress value={(tasks.filter(t => t.completed).length / tasks.length) * 100} className="bg-slate-100" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">En cours</span>
                        <span className="text-sm">{tasks.filter(t => !t.completed).length}</span>
                      </div>
                      <Progress value={(tasks.filter(t => !t.completed).length / tasks.length) * 100} className="bg-slate-100" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">En retard</span>
                        <span className="text-sm">{tasks.filter(t => !t.completed && t.dueDate && isBefore(new Date(t.dueDate), new Date()) && !isToday(new Date(t.dueDate))).length}</span>
                      </div>
                      <Progress 
                        value={(tasks.filter(t => !t.completed && t.dueDate && isBefore(new Date(t.dueDate), new Date()) && !isToday(new Date(t.dueDate))).length / tasks.length) * 100} 
                        className="bg-slate-100" 
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Par priorité</h3>
                  <div className="space-y-4">
                    {[0, 1, 2, 3].map(priority => (
                      <div key={priority}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">{getPriorityLabel(priority)}</span>
                          <span className="text-sm">{tasks.filter(t => t.priority === priority).length}</span>
                        </div>
                        <Progress 
                          value={(tasks.filter(t => t.priority === priority).length / tasks.length) * 100} 
                          className="bg-slate-100" 
                        />
                      </div>
                    ))}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Sans priorité</span>
                        <span className="text-sm">{tasks.filter(t => t.priority === null).length}</span>
                      </div>
                      <Progress 
                        value={(tasks.filter(t => t.priority === null).length / tasks.length) * 100} 
                        className="bg-slate-100" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 