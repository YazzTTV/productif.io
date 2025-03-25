"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { addDays, format, startOfWeek, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { Check } from "lucide-react"

interface Habit {
  id: string
  name: string
  color: string
  entries: {
    id: string
    date: Date
    completed: boolean
  }[]
}

interface HabitTrackerProps {
  habits: Habit[]
  onToggleHabit: (habitId: string, date: Date, completed: boolean) => void
}

export function HabitTracker({ habits, onToggleHabit }: HabitTrackerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const previousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7))
  }

  const nextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7))
  }

  const isToday = (date: Date) => isSameDay(date, new Date())

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Suivi hebdomadaire</h2>
        <div className="flex space-x-2">
          <Button onClick={previousWeek} variant="outline" size="sm">
            Semaine précédente
          </Button>
          <Button onClick={nextWeek} variant="outline" size="sm">
            Semaine suivante
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Habitude</th>
              {days.map((day) => (
                <th
                  key={day.toISOString()}
                  className={`px-4 py-2 text-center ${
                    isToday(day) ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="text-sm font-medium">
                    {format(day, "EEE", { locale: fr })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(day, "d MMM", { locale: fr })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => (
              <tr key={habit.id} className="border-t">
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    <span>{habit.name}</span>
                  </div>
                </td>
                {days.map((day) => {
                  const entry = habit.entries.find((e) =>
                    isSameDay(new Date(e.date), day)
                  )
                  return (
                    <td
                      key={day.toISOString()}
                      className={`px-4 py-4 text-center ${
                        isToday(day) ? "bg-blue-50" : ""
                      }`}
                    >
                      <Button
                        variant={entry?.completed ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() =>
                          onToggleHabit(habit.id, day, !entry?.completed)
                        }
                      >
                        <Check
                          className={`h-4 w-4 ${
                            entry?.completed ? "text-white" : "text-gray-400"
                          }`}
                        />
                      </Button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 