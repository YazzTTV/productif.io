"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

interface LeastTrackedHabit {
  id: string
  name: string
  completionRate: number
  color?: string
}

interface LeastTrackedHabitsProps {
  className?: string
}

export function LeastTrackedHabits({ className }: LeastTrackedHabitsProps) {
  const [habits7Days, setHabits7Days] = useState<LeastTrackedHabit[]>([])
  const [habits30Days, setHabits30Days] = useState<LeastTrackedHabit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeastTrackedHabits() {
      try {
        // Utiliser le nouvel endpoint dédié
        const response = await fetch("/api/habits/least-tracked", {
          credentials: "include",
        })
        
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des habitudes")
        }
        
        const data = await response.json()
        
        // Utiliser les données réelles de l'API
        setHabits7Days(data.habits7Days || [])
        setHabits30Days(data.habits30Days || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeastTrackedHabits()
  }, [])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Habitudes les moins suivies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Habitudes les moins suivies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  const noHabitsContent = (
    <div className="text-center py-6">
      <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
      <p className="text-sm text-gray-500 mb-4">
        Pas assez de données pour cette période
      </p>
      <Link href="/dashboard/habits">
        <Button variant="outline" className="w-full">
          <Calendar className="h-4 w-4 mr-2" />
          Gérer mes habitudes
        </Button>
      </Link>
    </div>
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Habitudes les moins suivies</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="7days">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="7days">7 jours</TabsTrigger>
            <TabsTrigger value="30days">30 jours</TabsTrigger>
          </TabsList>
          
          <TabsContent value="7days">
            {habits7Days.length === 0 ? (
              noHabitsContent
            ) : (
              <div className="space-y-4">
                {habits7Days.map((habit) => (
                  <div key={habit.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: habit.color || "#3B82F6" }}
                        />
                        <div className="font-medium">{habit.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-amber-600 font-medium">
                          {habit.completionRate}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full" 
                        style={{ width: `${habit.completionRate}%` }}
                      />
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/habits">
                  <Button variant="outline" className="w-full mt-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    Améliorer mes habitudes
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="30days">
            {habits30Days.length === 0 ? (
              noHabitsContent
            ) : (
              <div className="space-y-4">
                {habits30Days.map((habit) => (
                  <div key={habit.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: habit.color || "#3B82F6" }}
                        />
                        <div className="font-medium">{habit.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-orange-600 font-medium">
                          {habit.completionRate}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${habit.completionRate}%` }}
                      />
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/habits">
                  <Button variant="outline" className="w-full mt-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    Améliorer mes habitudes
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 