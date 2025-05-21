"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Habit, HabitEntry } from "@prisma/client"
import { cn } from "@/lib/utils"
import { format, isSameDay } from "date-fns"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface CustomHabitEntryProps {
  habit: Habit & {
    entries: HabitEntry[]
  }
  date: Date
  onUpdate: (habitId: string, date: Date, data: { completed?: boolean; note?: string; rating?: number }) => Promise<void>
}

export function CustomHabitEntry({ habit, date, onUpdate }: CustomHabitEntryProps) {
  const entry = habit.entries.find(e => isSameDay(new Date(e.date), date))
  const isCompleted = entry?.completed ?? false
  const [isOpen, setIsOpen] = useState(false)
  const [note, setNote] = useState(entry?.note || '')
  const [rating, setRating] = useState(entry?.rating || 0)
  const [isLoading, setIsLoading] = useState(false)

  const isLearningHabit = habit.name.toLowerCase().includes("apprentissage")
  const isDayRatingHabit = habit.name.toLowerCase().includes("note de sa journée")

  const handleToggle = async () => {
    try {
      await onUpdate(habit.id, date, { completed: !isCompleted })
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de l'habitude")
    }
  }

  const handleOpenDayNote = () => {
    setIsOpen(true)
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)

      if (isLearningHabit) {
        await onUpdate(habit.id, date, { 
          completed: true, 
          note 
        })
      } else if (isDayRatingHabit) {
        const numRating = Number(rating);
        if (isNaN(numRating) || numRating < 0 || numRating > 10) {
          toast.error("La note doit être un nombre entre 0 et 10");
          setIsLoading(false);
          return;
        }
        
        await onUpdate(habit.id, date, { 
          completed: true, 
          note, 
          rating: numRating 
        })
      }

      setIsOpen(false)
      toast.success("Entrée enregistrée avec succès")
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error)
      toast.error("Erreur lors de l'enregistrement. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderCheckbox = () => (
    <Checkbox
      checked={isCompleted}
      onCheckedChange={handleToggle}
      className={cn(
        "h-5 w-5",
        isCompleted && "bg-primary border-primary"
      )}
    />
  )

  // Fonction pour déterminer la couleur de la note
  function getRatingColor(rating: number): string {
    if (rating >= 8) return "bg-green-100 text-green-800";
    if (rating >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  }

  const renderRating = () => {
    // Si l'entrée n'existe pas ou n'a pas de note, afficher juste un bouton pour en ajouter
    if (!entry?.rating) {
      return (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs px-2 py-0 h-6"
          onClick={handleOpenDayNote}
        >
          Ajouter note
        </Button>
      );
    }
    
    // Si l'entrée a une note, l'afficher avec un badge coloré
    return (
      <Badge 
        className={cn(
          "cursor-pointer text-sm font-bold", 
          getRatingColor(entry.rating)
        )} 
        onClick={handleOpenDayNote}
      >
        {entry.rating}/10
      </Badge>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        {isLearningHabit ? (
          <>
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggle}
              className={cn(
                "h-5 w-5",
                isCompleted && "bg-primary border-primary"
              )}
            />
            {isCompleted && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs px-2 py-1 h-6"
                onClick={handleOpenDayNote}
              >
                +
              </Button>
            )}
          </>
        ) : isDayRatingHabit ? (
          renderRating()
        ) : (
          renderCheckbox()
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isLearningHabit 
                ? "Qu'avez-vous appris aujourd'hui ?" 
                : isDayRatingHabit 
                  ? "Note de votre journée" 
                  : "Entrée d'habitude"}
            </DialogTitle>
          </DialogHeader>
          
          {isDayRatingHabit && (
            <div className="flex flex-col space-y-2 py-2">
              <Label htmlFor="rating">Notez votre journée (0-10)</Label>
              <Input
                id="rating"
                type="number"
                min="0"
                max="10"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
          
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isLearningHabit 
              ? "Décrivez ce que vous avez appris aujourd'hui..." 
              : isDayRatingHabit
                ? "Pourquoi cette note ?"
                : "Note..."}
            className="min-h-[100px]"
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 