"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { HabitCard } from "./habit-card"
import { format, addDays, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Habit, HabitEntry } from "@prisma/client"
import Link from "next/link"

interface MobileHabitsCardsProps {
  habits: (Habit & { entries: HabitEntry[] })[]
  onToggleHabit: (habitId: string, date: Date, completed: boolean) => Promise<void>
  onCustomUpdate: (habitId: string, date: Date, data: { completed?: boolean; note?: string; rating?: number }) => Promise<void>
  loading?: boolean
}

export function MobileHabitsCards({ 
  habits, 
  onToggleHabit, 
  onCustomUpdate,
  loading = false 
}: MobileHabitsCardsProps) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)

  const handlePreviousDay = () => {
    setSelectedDate(prev => addDays(prev, -1))
    setCurrentCardIndex(0) // Reset to first card when changing date
  }

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1))
    setCurrentCardIndex(0) // Reset to first card when changing date
  }

  const handleToday = () => {
    setSelectedDate(startOfDay(new Date()))
    setCurrentCardIndex(0)
  }

  const handlePreviousCard = () => {
    setCurrentCardIndex(prev => Math.max(0, prev - 1))
  }

  const handleNextCard = () => {
    setCurrentCardIndex(prev => Math.min(habitsForToday.length - 1, prev + 1))
  }

  // Gestion du swipe tactile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return
    
    const distance = touchStartX - touchEndX
    const minSwipeDistance = 50
    
    if (distance > minSwipeDistance) {
      // Swipe vers la gauche - carte suivante
      handleNextCard()
    } else if (distance < -minSwipeDistance) {
      // Swipe vers la droite - carte précédente  
      handlePreviousCard()
    }
    
    setTouchStartX(null)
    setTouchEndX(null)
  }

  // Filtrer les habitudes pour le jour sélectionné
  const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  const habitsForToday = habits.filter(habit => 
    habit.daysOfWeek.includes(dayName)
  )

  // Calculer les statistiques du jour
  const completedHabits = habitsForToday.filter(habit => {
    const entry = habit.entries.find(e => 
      new Date(e.date).toDateString() === selectedDate.toDateString()
    )
    return entry?.completed ?? false
  }).length

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="space-y-4">
        {/* Navigation de date */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousDay}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {format(selectedDate, "EEEE d MMMM", { locale: fr })}
            </div>
            <div className="text-sm text-gray-500">
              {isToday ? "Aujourd'hui" : format(selectedDate, "yyyy", { locale: fr })}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            className="h-10 w-10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Bouton Aujourd'hui si pas déjà aujourd'hui */}
        {!isToday && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="text-green-600 hover:text-green-700"
            >
              Retour à aujourd'hui
            </Button>
          </div>
        )}

        {/* Statistiques du jour */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Progression du jour</div>
              <div className="text-2xl font-bold text-gray-900">
                {completedHabits}/{habitsForToday.length}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Pourcentage</div>
              <div className="text-2xl font-bold text-green-600">
                {habitsForToday.length > 0 
                  ? Math.round((completedHabits / habitsForToday.length) * 100)
                  : 0
                }%
              </div>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300 bg-green-500"
                style={{ 
                  width: `${habitsForToday.length > 0 
                    ? (completedHabits / habitsForToday.length) * 100 
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cartes empilées des habitudes */}
      {habitsForToday.length > 0 ? (
        <div className="space-y-4">
          {/* Indicateur de position et navigation */}
          {habitsForToday.length > 1 && (
            <div className="flex items-center justify-between px-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousCard}
                disabled={currentCardIndex === 0}
                className="h-8 w-8 p-0 rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                {habitsForToday.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-200",
                      index === currentCardIndex ? "bg-green-500 w-6" : "bg-gray-300"
                    )}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextCard}
                disabled={currentCardIndex === habitsForToday.length - 1}
                className="h-8 w-8 p-0 rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Container des cartes empilées */}
          <div 
            className="relative h-96 mx-2 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {habitsForToday.map((habit, index) => {
              const offset = index - currentCardIndex
              const isVisible = Math.abs(offset) <= 2 // Show max 3 cards at once
              
              if (!isVisible) return null

              return (
                <div
                  key={habit.id}
                  className={cn(
                    "absolute inset-0 transition-all duration-300 ease-out",
                    "transform-gpu"
                  )}
                  style={{
                    transform: `
                      translateX(${offset * 20}px) 
                      translateY(${Math.abs(offset) * 10}px) 
                      scale(${1 - Math.abs(offset) * 0.05})
                      rotateY(${offset * 5}deg)
                    `,
                    zIndex: 10 - Math.abs(offset),
                    opacity: Math.abs(offset) <= 1 ? 1 : 0.5,
                  }}
                >
                  <div className="w-full h-full">
            <HabitCard
              habit={habit}
              selectedDate={selectedDate}
              onToggle={onToggleHabit}
              onCustomUpdate={onCustomUpdate}
              loading={loading}
            />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Navigation par swipe (touch) */}
          {habitsForToday.length > 1 && (
            <div className="text-center text-xs text-gray-500 px-4">
              Glissez horizontalement ou utilisez les flèches pour naviguer
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune habitude prévue
          </h3>
          <p className="text-gray-500 mb-6">
            {isToday 
              ? "Aucune habitude n'est programmée pour aujourd'hui."
              : `Aucune habitude n'est programmée pour le ${format(selectedDate, "d MMMM", { locale: fr })}.`
            }
          </p>
          <Link href="/dashboard/habits/new">
            <Button className="bg-green-500 hover:bg-green-600">
              <Plus className="h-4 w-4 mr-2" />
              Créer une habitude
            </Button>
          </Link>
        </div>
      )}

      {/* Bouton flottant pour ajouter une habitude */}
      <div className="fixed bottom-20 right-4 z-50">
          <Link href="/dashboard/habits/new">
            <Button 
            className="rounded-full bg-green-500 hover:bg-green-600 shadow-lg px-4 py-3 h-auto"
            >
            <Plus className="h-5 w-5 mr-2" />
            <span className="font-medium">Nouvelle habitude</span>
            </Button>
          </Link>
        </div>
    </div>
  )
} 