"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CalendarCheck2, Info, Loader2, ThumbsUp } from "lucide-react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

interface HabitCompletion {
  id: string
  date: string
  createdAt: string
}

interface Habit {
  id: string
  title: string
  description: string | null
  frequency: string
  createdAt: string
  updatedAt: string
  completions: HabitCompletion[]
}

export default function ViewUserHabitsPage() {
  const params = useParams()
  const userId = params.userId as string
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [error, setError] = useState<string | null>(null)
  const today = new Date()

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
        
        // Récupérer les habitudes de l'utilisateur
        const habitsResponse = await fetch(`/api/users/${userId}/habits`)
        if (!habitsResponse.ok) {
          throw new Error("Impossible de récupérer les habitudes de l'utilisateur")
        }
        const habitsData = await habitsResponse.json()
        setHabits(habitsData.habits || [])
        
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
  
  // Calcul des statistiques
  const totalCompletions = habits.reduce((total, habit) => {
    return total + (habit.completions?.length || 0)
  }, 0)
  
  // Récupérer les jours de la semaine en cours
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 })
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 })
  const daysOfWeek = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek })
  
  // Récupérer les complétions de la semaine
  const completionsThisWeek = habits.reduce((total, habit) => {
    const weekCompletions = habit.completions?.filter(completion => {
      const completionDate = new Date(completion.date)
      return completionDate >= startOfCurrentWeek && completionDate <= endOfCurrentWeek
    })
    return total + (weekCompletions?.length || 0)
  }, 0)
  
  const habitCompletionToday = habits.filter(habit => {
    return habit.completions?.some(completion => {
      const completionDate = new Date(completion.date)
      return isSameDay(completionDate, today)
    })
  }).length
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Habitudes de {userData?.name || userData?.email || "l'utilisateur"}
      </h1>
      <p className="text-muted-foreground mb-6">
        Suivi des habitudes et de leur progression
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Habitudes suivies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{habits.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Habitudes en cours de suivi
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{habitCompletionToday}/{habits.length}</div>
            <Progress 
              className="mt-2" 
              value={habits.length > 0 ? (habitCompletionToday / habits.length) * 100 : 0} 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {format(today, "EEEE d MMMM", { locale: fr })}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Cette semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionsThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Complétions cette semaine
            </p>
          </CardContent>
        </Card>
      </div>
      
      {habits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CalendarCheck2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucune habitude n'a été créée
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {habits.map(habit => {
            // Calcul du nombre de complétions par jour de la semaine
            const completionsByDay = daysOfWeek.map(day => {
              const hasCompletion = habit.completions?.some(completion => {
                const completionDate = new Date(completion.date)
                return isSameDay(completionDate, day)
              })
              return {
                day,
                completed: hasCompletion
              }
            })
            
            // Calcul du taux de complétion cette semaine
            const completionsThisWeek = completionsByDay.filter(day => day.completed).length
            const weekCompletionRate = Math.round((completionsThisWeek / 7) * 100)
            
            return (
              <Card key={habit.id}>
                <CardHeader>
                  <CardTitle>{habit.title}</CardTitle>
                  <CardDescription>
                    {habit.frequency} • {habit.completions?.length || 0} fois réalisée
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {habit.description && (
                    <>
                      <p className="text-sm mb-4">{habit.description}</p>
                      <Separator className="mb-4" />
                    </>
                  )}
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Cette semaine</p>
                    <div className="flex justify-between mb-2">
                      {completionsByDay.map(({ day, completed }) => (
                        <div 
                          key={day.toString()} 
                          className="flex flex-col items-center"
                        >
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center mb-1
                            ${completed 
                              ? "bg-green-100 text-green-800" 
                              : isSameDay(day, today) 
                                ? "bg-slate-100 text-slate-800"
                                : "bg-slate-50 text-slate-400"
                            }
                          `}>
                            {format(day, "d")}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(day, "EEE", { locale: fr })}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Progress value={weekCompletionRate} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {weekCompletionRate}% complété cette semaine
                    </p>
                  </div>
                  
                  {/* Historique récent */}
                  {habit.completions && habit.completions.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <p className="text-sm font-medium mb-2">Dernières complétions</p>
                        <div className="space-y-2">
                          {habit.completions.slice(0, 5).map(completion => (
                            <div key={completion.id} className="flex items-center text-sm">
                              <ThumbsUp className="h-4 w-4 text-green-500 mr-2" />
                              <span>
                                {format(new Date(completion.date), "EEEE d MMMM yyyy", { locale: fr })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 