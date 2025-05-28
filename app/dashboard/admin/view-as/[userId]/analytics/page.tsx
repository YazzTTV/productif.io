"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, 
  LineChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Target, 
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Analytics {
  user: {
    id: string
    name: string
    email: string
    createdAt: string
  }
  taskAnalysis: Array<{
    title: string
    priority: string
    category: string
    total_count: number
    completed_count: number
    completion_rate: number
  }>
  habitCorrelation: Array<{
    habit_title: string
    frequency: string
    total_entries: number
    completed_entries: number
    completion_rate: number
    avg_mood_when_completed: number
    avg_mood_when_not_completed: number
  }>
  temporalStats: Array<{
    date: string
    tasks_created: number
    tasks_completed: number
    daily_completion_rate: number
  }>
  projectAnalysis: Array<{
    project_name: string
    description: string
    total_tasks: number
    completed_tasks: number
    project_completion_rate: number
    avg_task_duration_days: number
  }>
  weeklyPatterns: Array<{
    day_of_week: number
    tasks_created: number
    tasks_completed: number
    completion_rate: number
  }>
  moodAnalysis: {
    avg_mood: number
    min_mood: number
    max_mood: number
    total_entries: number
    avg_productivity: number
    great_days: number
    difficult_days: number
  } | null
  topCategories: Array<{
    category: string
    task_count: number
    completed_count: number
    completion_rate: number
  }>
  completionTimeAnalysis: {
    avg_completion_hours: number
    min_completion_hours: number
    max_completion_hours: number
    completed_tasks_with_time: number
  } | null
}

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function UserAnalyticsPage() {
  const params = useParams()
  const userId = params?.userId as string
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setError("ID utilisateur manquant")
      setIsLoading(false)
      return
    }

    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${userId}/analytics`)
        
        if (!response.ok) {
          throw new Error("Impossible de récupérer les analyses")
        }
        
        const data = await response.json()
        setAnalytics(data.analytics)
      } catch (error) {
        console.error("Erreur lors de la récupération des analyses:", error)
        setError("Impossible de récupérer les analyses de l'utilisateur")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAnalytics()
  }, [userId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return 'text-green-600'
    if (mood >= 6) return 'text-yellow-600'
    if (mood >= 4) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Analyse avancée - {analytics.user.name || analytics.user.email}
          </h1>
          <p className="text-muted-foreground">
            Insights détaillés sur les habitudes et performances
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Membre depuis {format(new Date(analytics.user.createdAt), "MMMM yyyy", { locale: fr })}
        </Badge>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="habits">Habitudes</TabsTrigger>
          <TabsTrigger value="mood">Humeur</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tâches les moins complétées */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Top 3 des tâches problématiques
                </CardTitle>
                <CardDescription>
                  Tâches avec le plus faible taux de completion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.taskAnalysis.slice(0, 3).map((task, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium truncate">{task.title}</h4>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority || 'Normal'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{task.category || 'Sans catégorie'}</span>
                      <span>{task.completed_count}/{task.total_count} complétées</span>
                    </div>
                    <Progress value={task.completion_rate} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.completion_rate}% de réussite
                    </p>
                  </div>
                ))}
                {analytics.taskAnalysis.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Pas assez de données pour l'analyse
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Catégories les plus utilisées */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Top catégories
                </CardTitle>
                <CardDescription>
                  Catégories de tâches les plus fréquentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{category.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.task_count} tâches
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{category.completion_rate}%</p>
                      <p className="text-xs text-muted-foreground">
                        {category.completed_count} complétées
                      </p>
                    </div>
                  </div>
                ))}
                {analytics.topCategories.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Aucune catégorie définie
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Temps de completion */}
          {analytics.completionTimeAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  Analyse des temps de completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(analytics.completionTimeAnalysis.avg_completion_hours)}h
                    </p>
                    <p className="text-sm text-muted-foreground">Temps moyen</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(analytics.completionTimeAnalysis.min_completion_hours)}h
                    </p>
                    <p className="text-sm text-muted-foreground">Plus rapide</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {Math.round(analytics.completionTimeAnalysis.max_completion_hours)}h
                    </p>
                    <p className="text-sm text-muted-foreground">Plus lent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {analytics.completionTimeAnalysis.completed_tasks_with_time}
                    </p>
                    <p className="text-sm text-muted-foreground">Tâches analysées</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="habits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-500" />
                Corrélation Habitudes & Humeur
              </CardTitle>
              <CardDescription>
                Impact des habitudes sur l'humeur quotidienne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.habitCorrelation.map((habit, index) => {
                const moodDifference = habit.avg_mood_when_completed - habit.avg_mood_when_not_completed
                const isPositiveImpact = moodDifference > 0.5
                
                return (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{habit.habit_title}</h4>
                      <Badge variant={isPositiveImpact ? "default" : "secondary"}>
                        {habit.frequency}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Taux de completion</p>
                        <p className="font-medium">{habit.completion_rate}%</p>
                        <Progress value={habit.completion_rate} className="mt-1" />
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Humeur quand fait</p>
                        <p className={`font-medium ${getMoodColor(habit.avg_mood_when_completed)}`}>
                          {habit.avg_mood_when_completed.toFixed(1)}/10
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Humeur quand pas fait</p>
                        <p className={`font-medium ${getMoodColor(habit.avg_mood_when_not_completed)}`}>
                          {habit.avg_mood_when_not_completed.toFixed(1)}/10
                        </p>
                      </div>
                    </div>
                    
                    {isPositiveImpact && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          Impact positif sur l'humeur (+{moodDifference.toFixed(1)} points)
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {analytics.habitCorrelation.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  Pas assez de données d'habitudes pour l'analyse
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mood" className="space-y-4">
          {analytics.moodAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Analyse de l'humeur (30 derniers jours)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className={`text-3xl font-bold ${getMoodColor(analytics.moodAnalysis.avg_mood)}`}>
                        {analytics.moodAnalysis.avg_mood.toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">Humeur moyenne</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">
                        {analytics.moodAnalysis.avg_productivity.toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">Productivité moyenne</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Humeur minimale</span>
                      <span className={`font-medium ${getMoodColor(analytics.moodAnalysis.min_mood)}`}>
                        {analytics.moodAnalysis.min_mood}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Humeur maximale</span>
                      <span className={`font-medium ${getMoodColor(analytics.moodAnalysis.max_mood)}`}>
                        {analytics.moodAnalysis.max_mood}/10
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition des journées</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Excellentes journées</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {analytics.moodAnalysis.great_days}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium">Journées difficiles</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600">
                      {analytics.moodAnalysis.difficult_days}
                    </span>
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    Sur {analytics.moodAnalysis.total_entries} entrées analysées
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Aucune donnée d'humeur disponible pour l'analyse
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500" />
                Patterns de productivité par jour de la semaine
              </CardTitle>
              <CardDescription>
                Analyse de la performance selon les jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.weeklyPatterns.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <span className="font-medium w-20">
                        {dayNames[day.day_of_week]}
                      </span>
                      <Progress value={day.completion_rate} className="w-32" />
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{day.completion_rate}%</p>
                      <p className="text-muted-foreground">
                        {day.tasks_completed}/{day.tasks_created}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {analytics.weeklyPatterns.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Pas assez de données pour l'analyse hebdomadaire
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Performance par projet
              </CardTitle>
              <CardDescription>
                Analyse détaillée de chaque projet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.projectAnalysis.map((project, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{project.project_name}</h4>
                    <Badge variant={project.project_completion_rate >= 80 ? "default" : "secondary"}>
                      {project.project_completion_rate}% complété
                    </Badge>
                  </div>
                  
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tâches</p>
                      <p className="font-medium">
                        {project.completed_tasks}/{project.total_tasks}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Durée moyenne/tâche</p>
                      <p className="font-medium">
                        {project.avg_task_duration_days ? 
                          `${Math.round(project.avg_task_duration_days)} jours` : 
                          'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Progression</p>
                      <Progress value={project.project_completion_rate} className="mt-1" />
                    </div>
                  </div>
                </div>
              ))}
              
              {analytics.projectAnalysis.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  Aucun projet avec des tâches à analyser
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 