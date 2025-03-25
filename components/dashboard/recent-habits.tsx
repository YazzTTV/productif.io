"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

const DAYS_OF_WEEK = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
}

interface Habit {
  id: string
  name: string
  frequency: string
  daysOfWeek: string[]
  lastCompleted?: string
  streak: number
  color?: string
}

export function RecentHabits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHabits() {
      try {
        const response = await fetch("/api/habits/recent", {
          credentials: "include",
        })
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des habitudes")
        }
        const data = await response.json()
        setHabits(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHabits()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Habitudes récentes</CardTitle>
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
      <Card>
        <CardHeader>
          <CardTitle>Habitudes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!habits || habits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Habitudes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 mb-4">
            Aucune habitude enregistrée
          </div>
          <Link href="/dashboard/habits">
            <Button variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Gérer mes habitudes
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Habitudes récentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {habits.map((habit) => (
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
                  <div className="text-sm font-medium">
                    {habit.streak} jours
                  </div>
                  {habit.lastCompleted && (
                    <div className="text-xs text-gray-500">
                      Dernière fois: {new Date(habit.lastCompleted).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {habit.frequency === "daily" ? (
                  <div>
                    Jours: {habit.daysOfWeek.map(day => DAYS_OF_WEEK[day as keyof typeof DAYS_OF_WEEK]).join(", ")}
                  </div>
                ) : (
                  <div>Fréquence: {habit.frequency}</div>
                )}
              </div>
            </div>
          ))}
          <Link href="/dashboard/habits">
            <Button variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Voir toutes mes habitudes
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
} 