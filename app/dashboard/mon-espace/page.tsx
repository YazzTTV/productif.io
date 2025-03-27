"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Layers, Pencil, Save, X, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface HabitEntry {
  id: string
  habitId: string
  date: string
  completed: boolean
  note?: string
  rating?: number
  createdAt: string
  updatedAt: string
  habit: {
    id: string
    name: string
    color: string
  }
}

interface Process {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

interface CompletedTask {
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

export default function MonEspacePage() {
  const [learningEntries, setLearningEntries] = useState<HabitEntry[]>([])
  const [ratingEntries, setRatingEntries] = useState<HabitEntry[]>([])
  const [processes, setProcesses] = useState<Process[]>([])
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingProcess, setEditingProcess] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{name: string, description: string}>({
    name: '',
    description: ''
  })

  const fetchData = async () => {
    try {
      // Récupérer les entrées d'habitudes
      const habitsResponse = await fetch('/api/habits/entries/all')
      if (!habitsResponse.ok) {
        throw new Error('Erreur lors de la récupération des entrées d\'habitudes')
      }
      const habitsData = await habitsResponse.json()
      
      // Récupérer les processus
      const processesResponse = await fetch('/api/processes')
      if (!processesResponse.ok) {
        throw new Error('Erreur lors de la récupération des processus')
      }
      const processesData = await processesResponse.json()

      // Récupérer les tâches terminées
      const tasksResponse = await fetch("/api/tasks/completed")
      if (!tasksResponse.ok) {
        throw new Error("Erreur lors de la récupération des tâches terminées")
      }
      const tasksData = await tasksResponse.json()
      
      // Filtrer les entrées par type d'habitude
      const learning = habitsData.filter((entry: HabitEntry) => 
        entry.habit.name.toLowerCase().includes('apprentissage') && entry.note
      )
      const ratings = habitsData.filter((entry: HabitEntry) => 
        entry.habit.name.toLowerCase().includes('note de sa journée') && (entry.note || entry.rating)
      )
      
      setLearningEntries(learning)
      setRatingEntries(ratings)
      setProcesses(processesData)
      setCompletedTasks(tasksData.tasks)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  function getRatingColor(rating: number): string {
    if (rating >= 8) return "bg-green-100 text-green-800";
    if (rating >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  }

  const handleEditClick = (process: Process) => {
    setEditingProcess(process.id)
    setEditForm({
      name: process.name,
      description: process.description
    })
  }

  const handleCancelEdit = () => {
    setEditingProcess(null)
  }

  const handleInputChange = (field: 'name' | 'description', value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveProcess = async (processId: string) => {
    try {
      const response = await fetch(`/api/processes/${processId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du processus')
      }

      toast.success("Processus mis à jour avec succès")
      setEditingProcess(null)
      // Rafraîchir les données
      fetchData()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du processus")
    }
  }

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Mon Espace</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Mon Espace</h1>
      
      <Tabs defaultValue="learning">
        <TabsList className="mb-4">
          <TabsTrigger value="learning">Apprentissages</TabsTrigger>
          <TabsTrigger value="ratings">Notes de journée</TabsTrigger>
          <TabsTrigger value="processes">Mes process</TabsTrigger>
          <TabsTrigger value="tasks">Tâches terminées</TabsTrigger>
        </TabsList>
        
        <TabsContent value="learning">
          <div className="space-y-4">
            {learningEntries.length > 0 ? (
              learningEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Apprentissage du {format(parseISO(entry.date), "d MMMM yyyy", { locale: fr })}</span>
                    </CardTitle>
                    <CardDescription>
                      Ajouté le {format(parseISO(entry.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{entry.note}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                Vous n&apos;avez pas encore enregistré d&apos;apprentissages
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="ratings">
          <div className="space-y-4">
            {ratingEntries.length > 0 ? (
              ratingEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Journée du {format(parseISO(entry.date), "d MMMM yyyy", { locale: fr })}</span>
                      <div className="flex items-center">
                        {entry.rating && (
                          <Badge className={cn("text-base px-3 py-1", getRatingColor(entry.rating))}>
                            {entry.rating}/10
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Ajouté le {format(parseISO(entry.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{entry.note}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                Vous n&apos;avez pas encore évalué vos journées
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="processes">
          <div className="space-y-4">
            {processes.length > 0 ? (
              processes.map((process) => (
                <Card key={process.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-indigo-500" />
                        {editingProcess === process.id ? (
                          <Input 
                            value={editForm.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="max-w-md"
                          />
                        ) : (
                          <span>{process.name}</span>
                        )}
                      </div>
                      
                      {editingProcess === process.id ? (
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleSaveProcess(process.id)}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Enregistrer
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditClick(process)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Créé le {format(parseISO(process.createdAt), "d MMMM yyyy", { locale: fr })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editingProcess === process.id ? (
                      <Textarea 
                        value={editForm.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="min-h-[100px]"
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{process.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                Vous n&apos;avez pas encore créé de processus
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tâches terminées</CardTitle>
              <CardDescription>
                Historique de vos tâches complétées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : completedTasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Aucune tâche terminée pour le moment
                </div>
              ) : (
                <div className="space-y-4">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium line-through text-muted-foreground">
                            {task.title}
                          </h3>
                          {task.priority !== null && (
                            <Badge className={getPriorityColor(task.priority)}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Terminée le {format(parseISO(task.updatedAt), "d MMMM yyyy", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 