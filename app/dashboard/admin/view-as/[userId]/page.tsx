"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart, CheckSquare, Clock, Info, LineChart, Target, Folder } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface HabitCompletion {
  id: string
  date: string
  createdAt: string
}

interface Habit {
  id: string
  title: string
  frequency: string
  completions?: HabitCompletion[]
}

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
  totalTasks: number
  completedTasks: number
  progress: number
}

export default function ViewAsPage() {
  const params = useParams()
  const userId = params.userId as string
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [stats, setStats] = useState<any>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
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
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(tasksData.tasks || [])
        } else {
          console.error("Erreur lors de la récupération des tâches")
        }
        
        // Récupérer les habitudes de l'utilisateur
        const habitsResponse = await fetch(`/api/users/${userId}/habits`)
        if (habitsResponse.ok) {
          const habitsData = await habitsResponse.json()
          setHabits(habitsData.habits || [])
        } else {
          console.error("Erreur lors de la récupération des habitudes")
        }

        // Récupérer les projets de l'utilisateur
        const projectsResponse = await fetch(`/api/users/${userId}/projects`)
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json()
          setProjects(projectsData.projects || [])
        } else {
          console.error("Erreur lors de la récupération des projets")
        }

        // Récupérer les statistiques de l'utilisateur
        const statsResponse = await fetch(`/api/users/${userId}/stats`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData.stats || null)
        } else {
          console.error("Erreur lors de la récupération des statistiques")
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error)
        setError("Impossible de récupérer les données de l'utilisateur")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserData()
  }, [userId])
  
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
  
  // Calcul des statistiques
  const completedTasks = stats ? stats.tasksCompleted : tasks.filter(task => task.completed).length
  const totalTasks = stats ? stats.tasksTotal : tasks.length
  const completionRate = stats ? stats.tasksCompletionRate : (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0)
  
  const todayDate = new Date()
  const overdueTasks = stats ? stats.tasksOverdue : tasks.filter(task => 
    !task.completed && task.dueDate && new Date(task.dueDate) < todayDate
  ).length
  
  // Habitudes complétées aujourd'hui
  const todayHabits = stats ? stats.habitsCompletedToday : habits.filter(habit => {
    if (!habit.completions || !Array.isArray(habit.completions)) return false
    return habit.completions.some(completion => {
      const completionDate = new Date(completion.date)
      return completionDate.toDateString() === todayDate.toDateString()
    })
  }).length

  // Nombre total d'habitudes
  const totalHabits = stats ? stats.habitsTotal : habits.length
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Tableau de bord de {userData?.name || userData?.email || "l'utilisateur"}
      </h1>
      <p className="text-muted-foreground mb-6">
        Vue d'ensemble des activités et performances
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tâches terminées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}/{totalTasks}</div>
            <Progress className="mt-2" value={completionRate} />
            <p className="text-xs text-muted-foreground mt-2">
              {completionRate}% des tâches sont terminées
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tâches en retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Tâches dépassant la date d'échéance
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Habitudes aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayHabits}/{totalHabits}</div>
            <Progress 
              className="mt-2" 
              value={totalHabits > 0 ? (todayHabits / totalHabits) * 100 : 0} 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {format(todayDate, "EEEE d MMMM", { locale: fr })}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">
            <CheckSquare className="mr-2 h-4 w-4" />
            Tâches récentes
          </TabsTrigger>
          <TabsTrigger value="habits">
            <Clock className="mr-2 h-4 w-4" />
            Habitudes
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart className="mr-2 h-4 w-4" />
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Folder className="mr-2 h-4 w-4" />
            Projets
          </TabsTrigger>
          <TabsTrigger value="objectives">
            <Target className="mr-2 h-4 w-4" />
            Objectifs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tâches récentes</CardTitle>
              <CardDescription>
                Les dernières tâches de l'utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Aucune tâche trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${task.completed ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.dueDate ? `Échéance: ${format(new Date(task.dueDate), "dd/MM/yyyy", { locale: fr })}` : "Sans échéance"}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm">
                        {task.priority !== null && (
                          <span className="inline-block rounded-full px-2 py-1 text-xs font-semibold bg-slate-100">
                            P{task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="habits">
          <Card>
            <CardHeader>
              <CardTitle>Habitudes</CardTitle>
              <CardDescription>
                Suivi des habitudes de l'utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {habits.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Aucune habitude trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {habits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{habit.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {habit.frequency} • {habit.completions?.length || 0} fois réalisée
                        </p>
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
              <CardTitle>Statistiques</CardTitle>
              <CardDescription>
                Performance globale de l'utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Tâches</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span>{stats.tasksTotal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Terminées</span>
                        <span>{stats.tasksCompleted}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">En retard</span>
                        <span>{stats.tasksOverdue}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taux d'achèvement</span>
                        <span>{stats.tasksCompletionRate}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Projets</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span>{stats.projectsTotal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Terminés</span>
                        <span>{stats.projectsCompleted}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taux d'achèvement</span>
                        <span>{stats.projectsTotal > 0 ? Math.round((stats.projectsCompleted / stats.projectsTotal) * 100) : 0}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Habitudes</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span>{stats.habitsTotal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Complétées aujourd'hui</span>
                        <span>{stats.habitsCompletedToday}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taux de complétion (aujourd'hui)</span>
                        <span>{stats.habitsTotal > 0 ? Math.round((stats.habitsCompletedToday / stats.habitsTotal) * 100) : 0}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Objectifs</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span>{stats.objectivesTotal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progression moyenne</span>
                        <span>{stats.objectivesProgress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Aucune statistique disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projets</CardTitle>
              <CardDescription>
                Liste des projets de l'utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Aucun projet trouvé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map(project => (
                    <div key={project.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.description || "Aucune description"} • Tâches: {project.completedTasks}/{project.totalTasks}
                        </p>
                        <Progress 
                          className="mt-2 h-1.5" 
                          value={project.progress} 
                        />
                      </div>
                      <div className="text-sm">
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                          project.status === "COMPLETED" ? "bg-green-100 text-green-800" : 
                          project.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" : 
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {project.status === "COMPLETED" ? "Terminé" : 
                           project.status === "IN_PROGRESS" ? "En cours" : 
                           "Non démarré"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="objectives">
          <Card>
            <CardHeader>
              <CardTitle>Objectifs</CardTitle>
              <CardDescription>
                Suivi des objectifs personnels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-24 w-24 text-slate-300 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Les objectifs détaillés sont disponibles dans l'onglet "Objectifs"
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 