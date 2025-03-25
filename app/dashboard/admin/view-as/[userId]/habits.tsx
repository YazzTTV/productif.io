"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Clock, Info, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react"
import { format, addWeeks, startOfWeek, addDays, startOfDay, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface HabitEntry {
  id: string
  date: string
  completed: boolean
  createdAt: string
  note?: string | null
  rating?: number | null
}

interface Habit {
  id: string
  name: string
  description: string | null
  frequency: string
  daysOfWeek: string[]
  entries: HabitEntry[]
}

export default function HabitsPage() {
  const params = useParams()
  const userId = params.userId as string
  const [isLoading, setIsLoading] = useState(true)
  const [habits, setHabits] = useState<Habit[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${userId}/habits`)
        
        if (!response.ok) {
          throw new Error("Impossible de récupérer les habitudes")
        }
        
        const data = await response.json()
        console.log("Données brutes reçues:", data)
        
        // Vérifier si data.habits existe et est un tableau
        if (!data.habits || !Array.isArray(data.habits)) {
          console.error("Format de données invalide:", data)
          throw new Error("Format de données invalide")
        }
        
        // Transformer les données reçues au format attendu
        const formattedHabits = data.habits.map((habit: any) => {
          // Extraire les jours de la semaine à partir de la fréquence
          const daysOfWeek = extractDaysFromFrequency(habit.frequency)
          
          // S'assurer que les complétions sont bien dans un tableau
          const completions = Array.isArray(habit.completions) ? habit.completions : []
          
          // Transformer les complétions en entries
          const entries = completions.map((completion: any) => ({
            id: completion.id,
            habitId: habit.id,
            date: completion.date,
            completed: true, // Les complétions sont toujours true
            createdAt: completion.createdAt,
            updatedAt: completion.createdAt,
            note: completion.note || null,
            rating: completion.rating || null
          }))
          
          return {
            id: habit.id,
            name: habit.title, // Renommer title en name pour la compatibilité
            description: habit.description,
            frequency: habit.frequency,
            createdAt: habit.createdAt,
            updatedAt: habit.updatedAt,
            daysOfWeek,
            entries
          }
        })
        
        console.log("Habitudes formatées:", formattedHabits)
        setHabits(formattedHabits)
      } catch (error) {
        console.error("Erreur lors de la récupération des habitudes:", error)
        setError("Impossible de récupérer les habitudes de l'utilisateur")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchHabits()
  }, [userId])
  
  // Fonction pour extraire les jours de la semaine à partir de la description de fréquence
  const extractDaysFromFrequency = (frequency: string): string[] => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const daysRegex = new RegExp(days.join('|'), 'gi')
    const foundDays = frequency?.match(daysRegex) || []
    
    if (foundDays.length > 0) {
      return foundDays.map(day => day.toLowerCase())
    }
    
    // Si aucun jour explicitement mentionné, on suppose tous les jours de la semaine
    if (frequency?.toLowerCase().includes('tous les jours') || 
        frequency?.toLowerCase().includes('daily') ||
        frequency?.toLowerCase().includes('quotidien')) {
      return days
    }
    
    // Par défaut, retourner les jours de semaine (lun-ven)
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  }

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, -1))
  }

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1))
  }

  // Générer les jours de la semaine
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeek, i)
    return startOfDay(date)
  })

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

  // Fonction pour récupérer la couleur d'une note
  function getRatingColor(rating: number): string {
    if (rating >= 8) return "bg-green-100 text-green-800";
    if (rating >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  }
  
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
  
  if (habits.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock className="h-24 w-24 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Aucune habitude trouvée</h2>
        <p className="text-muted-foreground">
          Cet utilisateur n'a pas encore créé d'habitudes
        </p>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Habitudes</h1>
      </div>
      
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {habits.map((habit) => {
                return (
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
                            // Affichage des habitudes spéciales (note/apprentissage)
                            <div className="flex items-center justify-center">
                              {habit.name.toLowerCase().includes("note de sa journée") && entry?.rating ? (
                                <div 
                                  className={cn(
                                    "text-xs px-2 py-1 rounded", 
                                    getRatingColor(entry.rating)
                                  )}
                                >
                                  {entry.rating}/10
                                </div>
                              ) : isCompleted ? (
                                <div className="text-xs px-2 py-1 text-green-600 bg-green-50 rounded">
                                  Note ajoutée
                                </div>
                              ) : (
                                <div className="text-xs px-2 py-1 text-gray-500">
                                  {isScheduledDay ? "Non rempli" : ""}
                                </div>
                              )}
                            </div>
                          ) : (
                            // Affichage des cases à cocher standard
                            <Checkbox
                              checked={isCompleted}
                              disabled={true}
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
                  </TableRow>
                )
              })}
              {habits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    Aucune habitude enregistrée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
} 