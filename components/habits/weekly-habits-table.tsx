"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
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
import { format, addWeeks, startOfWeek, addDays, startOfDay, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Habit, HabitEntry } from "@prisma/client"
import { Checkbox } from "@/components/ui/checkbox"
import { CustomHabitEntry } from "./custom-habit-entry"
import { toast } from "sonner"

interface WeeklyHabitsTableProps {
  habits: (Habit & {
    entries: HabitEntry[]
  })[]
  onToggleHabit: (habitId: string, date: Date, completed: boolean) => Promise<void>
}

export function WeeklyHabitsTable({
  habits,
  onToggleHabit,
}: WeeklyHabitsTableProps) {
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [loading, setLoading] = useState<string | null>(null)

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, -1))
  }

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1))
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeek, i)
    return startOfDay(date)
  })

  const handleToggle = async (
    habitId: string,
    date: Date,
    currentCompleted: boolean
  ) => {
    if (loading) return
    
    try {
      setLoading(habitId)
      // S'assurer que la date est correctement formatée
      const targetDate = new Date(date)
      targetDate.setHours(12, 0, 0, 0) // Définir à midi pour éviter les problèmes de fuseau horaire
      
      console.log('Toggle habit:', {
        habitId,
        date: targetDate.toISOString(),
        currentCompleted
      })
      await onToggleHabit(habitId, targetDate, currentCompleted)
    } finally {
      setLoading(null)
    }
  }

  const handleCustomUpdate = async (
    habitId: string,
    date: Date,
    data: { completed?: boolean; note?: string; rating?: number }
  ) => {
    if (loading) return
    
    try {
      setLoading(habitId)
      const targetDate = new Date(date)
      targetDate.setHours(12, 0, 0, 0)
      
      // Envoyer la requête au serveur
      const response = await fetch("/api/habits/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habitId,
          date: targetDate.toISOString(),
          completed: data.completed !== undefined ? data.completed : true,
          note: data.note,
          rating: data.rating
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'habitude")
      }

      // Mettre à jour l'UI optimiste
      window.location.reload() // Ceci est une solution temporaire, idéalement nous mettrions à jour l'état local
    } catch (error) {
      console.error("Error updating habit:", error)
      toast.error("Erreur lors de la mise à jour de l'habitude")
    } finally {
      setLoading(null)
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    try {
      setLoading(habitId)
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
      setLoading(null)
    }
  }

  const DAYS_OF_WEEK = {
    "monday": "L",
    "tuesday": "M",
    "wednesday": "M",
    "thursday": "J",
    "friday": "V",
    "saturday": "S",
    "sunday": "D"
  }

  // Fonctions pour identifier les habitudes spéciales
  const isSpecialHabit = (habitName: string) => {
    return habitName.toLowerCase().includes("apprentissage") || 
           habitName.toLowerCase().includes("note de sa journée")
  }

  // Fonction pour vérifier si une habitude est par défaut (et donc non supprimable/modifiable)
  const isDefaultHabit = (habitName: string) => {
    return habitName.toLowerCase().includes("apprentissage") || 
           habitName.toLowerCase().includes("note de sa journée")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Semaine du {format(currentWeek, "d MMMM yyyy", { locale: fr })}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Habitude</TableHead>
              <TableHead className="w-[100px]">Jours</TableHead>
              {weekDays.map((date) => (
                <TableHead key={date.toISOString()} className="text-center">
                  <div className="font-medium">
                    {format(date, "EEE", { locale: fr })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(date, "d MMM", { locale: fr })}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {habits.map((habit) => (
              <TableRow key={habit.id}>
                <TableCell className="font-medium">{habit.name}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {habit.daysOfWeek.map((day) => (
                      <span key={day} className="text-xs bg-gray-100 px-1 rounded">
                        {DAYS_OF_WEEK[day as keyof typeof DAYS_OF_WEEK]}
                      </span>
                    ))}
                  </div>
                </TableCell>
                {weekDays.map((date) => {
                  const entry = habit.entries.find((e) =>
                    isSameDay(new Date(e.date), date)
                  )
                  const isCompleted = entry?.completed ?? false
                  const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
                  const isScheduledDay = habit.daysOfWeek.includes(dayName)

                  return (
                    <TableCell key={date.toISOString()} className="text-center">
                      {isSpecialHabit(habit.name) ? (
                        <CustomHabitEntry 
                          habit={habit} 
                          date={date} 
                          onUpdate={handleCustomUpdate} 
                        />
                      ) : (
                        <Checkbox
                          checked={isCompleted}
                          disabled={loading === habit.id || !isScheduledDay}
                          onCheckedChange={() =>
                            handleToggle(habit.id, date, isCompleted)
                          }
                          className={cn(
                            "h-5 w-5",
                            isCompleted && "bg-primary border-primary",
                            !isScheduledDay && "opacity-50"
                          )}
                        />
                      )}
                    </TableCell>
                  )
                })}
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {!isDefaultHabit(habit.name) && (
                      <>
                        <Link href={`/dashboard/habits/${habit.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-gray-700"
                            disabled={loading === habit.id}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-500 hover:text-red-500"
                              disabled={loading === habit.id}
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
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {habits.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  Aucune habitude enregistrée. Commencez par en créer une !
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
} 