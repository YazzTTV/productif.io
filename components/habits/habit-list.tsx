"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"

interface Habit {
  id: string
  name: string
  description: string | null
  color: string
}

interface HabitsListProps {
  habits: Habit[]
  onAddHabit: (habit: { name: string; description?: string; color: string }) => void
  onDeleteHabit: (habitId: string) => void
}

export function HabitsList({ habits, onAddHabit, onDeleteHabit }: HabitsListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddHabit(newHabit)
    setNewHabit({ name: "", description: "", color: "#3B82F6" })
    setIsAdding(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Mes habitudes</h2>
        <Button onClick={() => setIsAdding(true)} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une habitude
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <Input
              placeholder="Nom de l'habitude"
              value={newHabit.name}
              onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Textarea
              placeholder="Description (optionnelle)"
              value={newHabit.description}
              onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
            />
          </div>
          <div>
            <Input
              type="color"
              value={newHabit.color}
              onChange={(e) => setNewHabit({ ...newHabit, color: e.target.value })}
              className="h-10 w-20"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter</Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: habit.color }}
              />
              <div>
                <h3 className="font-medium">{habit.name}</h3>
                {habit.description && (
                  <p className="text-sm text-gray-500">{habit.description}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteHabit(habit.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 