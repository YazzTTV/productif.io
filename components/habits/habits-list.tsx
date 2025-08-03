"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/components/ui/use-toast"

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

// File d'attente pour les actions d'habitudes
interface QueuedAction {
  habitId: string
  date: Date
  completed: boolean
}

interface HabitsListProps {
  habits: Habit[]
}

export function HabitsList({ habits: initialHabits }: HabitsListProps) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits)
  const [actionsQueue, setActionsQueue] = useState<QueuedAction[]>([])
  const [processingQueue, setProcessingQueue] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  // Traiter la file d'attente d'actions
  useEffect(() => {
    const processQueue = async () => {
      if (actionsQueue.length === 0 || processingQueue) return
      
      setProcessingQueue(true)
      
      try {
        // Prendre les 10 premières actions pour traitement par lot
        const batch = actionsQueue.slice(0, 10)
        
        // Appeler l'API batch avec le lot d'actions
        const response = await fetch("/api/habits/entries/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ actions: batch }),
        })

        if (!response.ok) {
          throw new Error("Erreur lors du traitement du lot d'habitudes")
        }
        
        // Récupérer la réponse
        const result = await response.json()
        console.log("Résultat du traitement par lot:", result)
        
        // Supprimer les actions traitées de la file
        setActionsQueue(prev => prev.slice(batch.length))
        
        // Rafraîchir les métriques du dashboard seulement à la fin du traitement complet
        // et seulement si nous avons effectivement terminé tous les traitements
        if (actionsQueue.length <= batch.length) {
          try {
            // Utilisation d'un timestamp pour éviter la mise en cache
            const timestamp = new Date().getTime()
            await fetch(`/api/dashboard/metrics?t=${timestamp}`, { 
              method: "GET",
              headers: { "Cache-Control": "no-cache" },
              // Ne pas attendre la réponse pour éviter de bloquer
              cache: "no-store"
            })
            
            // Laisser un délai avant d'autoriser de nouvelles requêtes
            setTimeout(() => {
              console.log("Métriques du dashboard rafraîchies")
            }, 500)
          } catch (refreshError) {
            console.error("Erreur lors du rafraîchissement des métriques:", refreshError)
          }
        }
        
      } catch (error) {
        console.error("Error processing habit queue:", error)
        toast({
          title: "Erreur",
          description: "Certaines actions n'ont pas pu être sauvegardées. Réessayez plus tard.",
          variant: "destructive"
        })
      } finally {
        // Ajouter un délai avant de réinitialiser l'état pour éviter les traitements trop rapides
        setTimeout(() => {
          setProcessingQueue(false)
        }, 500)
      }
    }
    
    // Traiter la file d'attente avec un délai pour éviter les boucles infinies
    const timerId = setTimeout(processQueue, 300)
    
    // Nettoyer le timer pour éviter les fuites de mémoire
    return () => clearTimeout(timerId)
  }, [actionsQueue, processingQueue, toast])

  // Ajouter une action à la file d'attente et mettre à jour l'UI de manière optimiste
  const handleToggleHabit = (habitId: string, date: Date, completed: boolean) => {
    // Mise à jour optimiste de l'interface
    setHabits(prevHabits => 
      prevHabits.map(habit => {
        if (habit.id !== habitId) return habit
        
        const dateTime = new Date(date).setHours(0, 0, 0, 0)
        
        const updatedEntries = [...habit.entries]
        const entryIndex = updatedEntries.findIndex(
          e => new Date(e.date).setHours(0, 0, 0, 0) === dateTime
        )
        
        if (entryIndex >= 0) {
          // Mettre à jour l'entrée existante
          updatedEntries[entryIndex] = {
            ...updatedEntries[entryIndex],
            completed
          }
        } else {
          // Créer une nouvelle entrée
          updatedEntries.push({
            id: `temp-${Date.now()}`, // ID temporaire
            date: new Date(date),
            completed,
            habitId
          })
        }
        
        return {
          ...habit,
          entries: updatedEntries
        }
      })
    )
    
    // Ajouter l'action à la file d'attente
    setActionsQueue(prev => [...prev, { habitId, date, completed }])
  }

  const handleDeleteHabit = async (habitId: string) => {
    try {
      setIsDeleting(habitId)
      const response = await fetch(`/api/habits/${habitId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'habitude")
      }

      // Mise à jour optimiste de l'interface
      setHabits(prevHabits => prevHabits.filter(h => h.id !== habitId))
      
      toast({
        title: "Succès",
        description: "Habitude supprimée avec succès",
      })
    } catch (error) {
      console.error("Error deleting habit:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'habitude",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(null)
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
                  disabled={isDeleting === habit.id}
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
                  
                  // Vérifier si l'action est dans la file d'attente
                  const isInQueue = actionsQueue.some(
                    action => 
                      action.habitId === habit.id && 
                      new Date(action.date).setHours(0, 0, 0, 0) === date.getTime()
                  )

                  return (
                    <TableCell key={date.toISOString()} className="text-center p-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className={`
                          ${entry?.completed ? "bg-green-500 hover:bg-green-600 text-white border-green-500" : ""}
                          ${isInQueue ? "animate-pulse" : ""}
                          ${!isScheduledDay ? "opacity-50" : ""}
                        `}
                        onClick={() => handleToggleHabit(habit.id, date, !entry?.completed)}
                        disabled={!isScheduledDay}
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
      
      {actionsQueue.length > 0 && (
        <div className="fixed bottom-32 right-4 bg-primary text-white px-4 py-2 rounded-md shadow-lg">
          {processingQueue ? 
            "Synchronisation en cours..." : 
            `${actionsQueue.length} modification${actionsQueue.length > 1 ? 's' : ''} en attente`
          }
        </div>
      )}
    </div>
  )
} 