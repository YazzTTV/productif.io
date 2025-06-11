"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Habit } from "@prisma/client"

interface HabitNoteModalProps {
  habit: Habit
  isOpen: boolean
  onClose: () => void
  onSave: (note: string, rating?: number) => Promise<void>
  initialNote?: string
  initialRating?: number
}

export function HabitNoteModal({
  habit,
  isOpen,
  onClose,
  onSave,
  initialNote = "",
  initialRating
}: HabitNoteModalProps) {
  const [note, setNote] = useState(initialNote)
  const [rating, setRating] = useState(initialRating || 5)
  const [isLoading, setIsLoading] = useState(false)

  // Mettre à jour les valeurs quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setNote(initialNote)
      setRating(initialRating || 5)
    }
  }, [isOpen, initialNote, initialRating])

  // Identifier le type d'habitude
  const isLearningHabit = habit.name.toLowerCase().includes('apprentissage')
  const isDayNoteHabit = habit.name.toLowerCase().includes('note de sa journée')

  const handleSave = async () => {
    setIsLoading(true)
    try {
      if (isLearningHabit) {
        // Pour l'apprentissage : seulement la note est importante
        await onSave(note)
      } else if (isDayNoteHabit) {
        // Pour "Note de sa journée" : rating obligatoire, note optionnelle
        await onSave(note, rating)
      } else {
        // Pour les autres habitudes avec notes
        await onSave(note)
      }
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setNote(initialNote)
    setRating(initialRating || 5)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] mx-2 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: habit.color || "#3B82F6" }}
            />
            <span>{habit.name}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isLearningHabit 
              ? "Décrivez ce que vous avez appris aujourd'hui"
              : isDayNoteHabit 
              ? "Notez votre journée sur 10 et expliquez pourquoi"
              : "Ajoutez une note pour cette habitude"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Note/Apprentissage */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm">
  {isLearningHabit 
                ? "Qu'avez-vous appris ?" 
                : isDayNoteHabit 
                ? "Comment s'est passée votre journée ?" 
                : "Note (optionnel)"
              }
            </Label>
            <Textarea
              id="note"
              placeholder={
                isLearningHabit 
                  ? "Décrivez ce que vous avez appris, les concepts clés, vos réflexions..."
                  : isDayNoteHabit
                  ? "Expliquez comment s'est passée votre journée..."
                  : "Ajoutez une note sur cette session..."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Rating pour "Note de sa journée" */}
          {isDayNoteHabit && (
            <div className="space-y-2">
              <Label className="text-sm">Note de votre journée</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mauvaise (1)</span>
                  <span>Excellente (10)</span>
                </div>
                <div className="flex space-x-1 justify-center">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`
                        w-7 h-7 rounded-full text-xs font-medium transition-all
                        ${rating >= value 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }
                      `}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Évaluez votre journée de 1 à 10
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 text-sm py-2"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
disabled={isLoading || (isLearningHabit && !note.trim())}
            className="flex-1 bg-green-500 hover:bg-green-600 text-sm py-2"
          >
            {isLoading ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 