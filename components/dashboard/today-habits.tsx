"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Check, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface Habit {
  id: string
  name: string
  description: string | null
  color: string | null
  completed: boolean
  entryId: string | null
}

export function TodayHabits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const fetchHabits = async () => {
    try {
      setRefreshing(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/habits/today?t=${timestamp}`, {
        cache: "no-store",
      })
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des habitudes")
      }
      
      const data = await response.json()
      setHabits(data)
      setLastRefresh(new Date())
      setError("")
    } catch (err) {
      console.error("Erreur:", err)
      setError("Impossible de charger les habitudes. Veuillez réessayer.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHabits()
    
    // Rafraîchir les données toutes les 30 secondes
    const intervalId = setInterval(() => {
      fetchHabits()
    }, 30000)

    return () => clearInterval(intervalId)
  }, [])

  const handleRefresh = () => {
    fetchHabits()
  }

  const toggleHabitStatus = async (habitId: string, completed: boolean, entryId: string | null) => {
    try {
      const response = await fetch("/api/habits/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habitId,
          completed,
          entryId,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'habitude")
      }

      // Mettre à jour l'état local des habitudes
      setHabits((prevHabits) =>
        prevHabits.map((habit) =>
          habit.id === habitId
            ? {
                ...habit,
                completed: !completed,
                entryId: completed ? null : entryId || "temp-id",
              }
            : habit
        )
      )
      
      // Rafraîchir les habitudes après mise à jour
      fetchHabits()
    } catch (err) {
      console.error("Erreur:", err)
      setError("Impossible de mettre à jour l'habitude. Veuillez réessayer.")
    }
  }

  const completedCount = habits.filter((habit) => habit.completed).length
  const totalHabits = habits.length
  const percentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0

  const formatLastRefresh = () => {
    return formatDistanceToNow(lastRefresh, { 
      addSuffix: true,
      locale: fr 
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Habitudes du jour</CardTitle>
          <CardDescription>Chargement de vos habitudes...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[56px] w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Habitudes du jour</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh}>Réessayer</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Habitudes du jour</CardTitle>
            <CardDescription>
              Suivez vos progrès au quotidien
            </CardDescription>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 flex gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only sm:not-sr-only sm:inline-block">Rafraîchir</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {habits.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Aucune habitude pour aujourd'hui.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {completedCount} sur {totalHabits} ({percentage}%)
              </span>
              <span className="text-xs text-muted-foreground">
                Mis à jour {formatLastRefresh()}
              </span>
            </div>
            <Progress value={percentage} className="h-2 mb-4" />
            <div className="space-y-2">
              {habits.map((habit) => (
                <div 
                  key={habit.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                  style={habit.color ? { borderLeft: `4px solid ${habit.color}` } : {}}
                >
                  <span className="font-medium">{habit.name}</span>
                  {habit.completed ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-green-100"
                      onClick={() => toggleHabitStatus(habit.id, habit.completed, habit.entryId)}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-gray-100"
                      onClick={() => toggleHabitStatus(habit.id, habit.completed, habit.entryId)}
                    >
                      <X className="h-4 w-4 text-gray-600" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 