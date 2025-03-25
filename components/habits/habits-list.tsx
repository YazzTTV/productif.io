"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Check, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface HabitEntry {
  id: string
  date: Date
  completed: boolean
  habitId: string
}

interface Habit {
  id: string
  name: string
  description: string | null
  color: string | null
  frequency: string
  daysOfWeek: string[]
  entries: HabitEntry[]
}

interface HabitsListProps {
  habits: Habit[]
}

export function HabitsList({ habits }: HabitsListProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleToggleHabit = async (habitId: string, date: Date, completed: boolean) => {
    try {
      setIsLoading(habitId)
      const response = await fetch("/api/habits/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ habitId, date, completed }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'habitude")
      }

      // Recharger la page pour mettre à jour les données
      window.location.reload()
    } catch (error) {
      console.error("Error toggling habit:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    try {
      setIsLoading(habitId)
      const response = await fetch(`/api/habits/${habitId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'habitude")
      }

      // Recharger la page pour mettre à jour les données
      window.location.reload()
    } catch (error) {
      console.error("Error deleting habit:", error)
    } finally {
      setIsLoading(null)
    }
  }

  // Obtenir les 7 derniers jours
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    return date
  }).reverse()

  const DAYS_OF_WEEK = {
    "monday": "Lundi",
    "tuesday": "Mardi",
    "wednesday": "Mercredi",
    "thursday": "Jeudi",
    "friday": "Vendredi",
    "saturday": "Samedi",
    "sunday": "Dimanche"
  }

  return (
    <div className="space-y-8">
      {habits.map((habit) => (
        <Card key={habit.id} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-medium">{habit.name}</h3>
              {habit.description && (
                <p className="text-sm text-gray-500 mt-1">{habit.description}</p>
              )}
              <div className="flex gap-2 mt-2">
                {habit.daysOfWeek?.map((day) => (
                  <span key={day} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {DAYS_OF_WEEK[day as keyof typeof DAYS_OF_WEEK]}
                  </span>
                ))}
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-red-500"
                  disabled={isLoading === habit.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer l'habitude</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer cette habitude ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                {last7Days.map((date) => (
                  <TableHead key={date.toISOString()} className="text-center">
                    <div className="font-medium">
                      {date.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {last7Days.map((date) => {
                  const entry = habit.entries.find(
                    (e) => new Date(e.date).setHours(0, 0, 0, 0) === date.getTime()
                  )
                  const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
                  const isScheduledDay = habit.daysOfWeek?.includes(dayName)

                  return (
                    <TableCell key={date.toISOString()} className="text-center p-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className={`
                          ${entry?.completed ? "bg-green-500 hover:bg-green-600 text-white border-green-500" : ""}
                          ${!isScheduledDay ? "opacity-50" : ""}
                        `}
                        onClick={() => handleToggleHabit(habit.id, date, !entry?.completed)}
                        disabled={isLoading === habit.id || !isScheduledDay}
                      >
                        {entry?.completed ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  )
                })}
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      ))}

      {habits.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucune habitude enregistrée. Commencez par en créer une !
        </div>
      )}
    </div>
  )
} 