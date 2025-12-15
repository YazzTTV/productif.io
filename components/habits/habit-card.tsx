"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Habit, HabitEntry } from "@prisma/client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { HabitNoteModal } from "./habit-note-modal"

interface HabitCardProps {
  habit: Habit & { entries: HabitEntry[] }
  selectedDate: Date
  onToggle: (habitId: string, date: Date, completed: boolean) => Promise<void>
  onCustomUpdate?: (habitId: string, date: Date, data: { completed?: boolean; note?: string; rating?: number }) => Promise<void>
  loading?: boolean
}

export function HabitCard({ 
  habit, 
  selectedDate, 
  onToggle, 
  onCustomUpdate,
  loading = false 
}: HabitCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)

  // Trouver l'entrée pour la date sélectionnée
  const entry = habit.entries.find((e) => 
    new Date(e.date).toDateString() === selectedDate.toDateString()
  )

  const isCompleted = entry?.completed ?? false
  const currentValue = entry?.rating ?? (isCompleted ? 1 : 0)

  // Vérifier si c'est un jour prévu pour cette habitude
  const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  const isScheduledDay = habit.daysOfWeek.includes(dayName)

  // Habitudes spéciales (seulement "Apprentissage" et "Note de sa journée")
  const isLearningHabit = habit.name.toLowerCase().includes("apprentissage")
  const isDayNoteHabit = habit.name.toLowerCase().includes("note de sa journée") || 
                        habit.name.toLowerCase().includes("note de la journée") ||
                        (habit.name.toLowerCase().includes("note") && habit.name.toLowerCase().includes("journée"))
  const isSpecialHabit = isLearningHabit || isDayNoteHabit

  const handleIncrement = async () => {
    if (isUpdating || loading) return
    
    setIsUpdating(true)
    try {
      if (onCustomUpdate) {
        // Utiliser onCustomUpdate pour toutes les habitudes si disponible
        await onCustomUpdate(habit.id, selectedDate, { 
          completed: true
        })
      } else {
        await onToggle(habit.id, selectedDate, false) // false car on toggle vers true
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDecrement = async () => {
    if (isUpdating || loading) return
    
    setIsUpdating(true)
    try {
      if (onCustomUpdate) {
        // Utiliser onCustomUpdate pour toutes les habitudes si disponible
        await onCustomUpdate(habit.id, selectedDate, { 
          completed: false
        })
      } else {
        await onToggle(habit.id, selectedDate, true) // true car on toggle vers false
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCircleClick = async () => {
    if (isUpdating || loading) return
    
    setIsUpdating(true)
    try {
      if (onCustomUpdate) {
        // Utiliser onCustomUpdate pour toutes les habitudes si disponible
        await onCustomUpdate(habit.id, selectedDate, { 
          completed: !isCompleted
        })
      } else {
        await onToggle(habit.id, selectedDate, isCompleted)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveNote = async (note: string, rating?: number) => {
    if (!onCustomUpdate) return
    
    setIsUpdating(true)
    try {
      await onCustomUpdate(habit.id, selectedDate, {
        completed: true,
        note,
        rating: rating || 5
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Calcul du pourcentage pour le cercle de progression
  const maxValue = 1 // Toutes les habitudes sont sur 1 dans l'interface carte
  const percentage = (isCompleted ? 1 : 0) * 100
  const circumference = 2 * Math.PI * 45 // rayon de 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Card className={cn(
      "p-6 relative transition-all duration-500 hover:shadow-lg",
      isCompleted ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-md" : "bg-white hover:bg-gray-50",
      !isScheduledDay && "opacity-60"
    )}>
      {/* Indicateur de couleur avec gradient */}
      <div 
        className="absolute top-0 left-0 w-1.5 h-full rounded-l-lg shadow-sm transition-all duration-500"
        style={{ 
          background: isCompleted 
            ? `linear-gradient(to bottom, #10B981, #059669)` 
            : `linear-gradient(to bottom, #EF4444, #DC2626)`
        }}
      />

      {/* Badge de statut */}
      {isCompleted && (
        <div className="absolute top-3 right-3 animate-in fade-in duration-500">
          <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
        </div>
      )}

      {/* Nom de l'habitude avec meilleur style */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-gray-900 text-base leading-tight">
          {habit.name}
        </h3>
          {habit.userCategoryOverride && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Manuel
            </span>
          )}
        </div>
        {!isScheduledDay ? (
          <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
            Non prévu aujourd'hui
          </p>
        ) : (
          <p className="text-xs text-gray-600">
            {habit.description || "Cliquez pour compléter"}
          </p>
        )}
      </div>

      {/* Cercle de progression amélioré */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative group">
          <svg 
            className={cn(
              "w-28 h-28 transform -rotate-90 transition-all duration-500 group-hover:scale-105",
              isUpdating ? "cursor-wait" : "cursor-pointer"
            )}
            onClick={handleCircleClick}
          >
            {/* Cercle de fond */}
            <circle
              cx="56"
              cy="56"
              r="50"
              stroke="#F3F4F6"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Cercle de progression */}
            <circle
              cx="56"
              cy="56"
              r="50"
              stroke={isCompleted ? "#10B981" : "#EF4444"}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 50}
              strokeDashoffset={isCompleted ? 0 : 2 * Math.PI * 50}
              strokeLinecap="round"
              className="transition-all duration-500 ease-in-out drop-shadow-sm"
            />
          </svg>
          
          {/* Valeur au centre avec animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "text-3xl font-bold transition-all duration-500",
              isCompleted ? "text-green-600 scale-110" : "text-red-500"
            )}>
              {isCompleted ? "✓" : "0"}
            </span>
          </div>

          {/* Glow effet quand complété */}
          {isCompleted && (
            <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 blur-xl animate-in fade-in duration-500"></div>
          )}
        </div>
      </div>

      {/* Boutons de contrôle */}
      {isScheduledDay && (
        <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="w-12 h-12 rounded-full p-0"
            onClick={handleDecrement}
            disabled={isUpdating || loading || currentValue <= 0}
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <div className="text-xs text-gray-500">
              {isCompleted ? "Fait" : "À faire"}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-12 h-12 rounded-full p-0"
            onClick={handleIncrement}
            disabled={isUpdating || loading || isCompleted}
          >
            <Plus className="h-4 w-4" />
          </Button>
          </div>

          {/* Bouton spécial pour les habitudes d'apprentissage/notes */}
          {isSpecialHabit && (
            <Button
              onClick={() => setShowNoteModal(true)}
              disabled={isUpdating || loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-0 shadow-md"
              size="sm"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">
                  {isLearningHabit ? "✏️" : "📝"}
                </span>
                <span>
                  {isLearningHabit ? "Ajouter apprentissage" : "Ajouter note"}
                </span>
              </div>
            </Button>
          )}
        </div>
      )}

      {/* Modal pour les notes et apprentissages */}
      <HabitNoteModal
        habit={habit}
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSave={handleSaveNote}
        initialNote={entry?.note || ""}
        initialRating={entry?.rating || undefined}
      />
    </Card>
  )
} 