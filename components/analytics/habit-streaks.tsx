 "use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Flame } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Habit {
  id: string
  name: string
  currentStreak: number
}

export function HabitStreaks() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHabits()
  }, [])

  const fetchHabits = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/habits")
      if (response.ok) {
        const data = await response.json()
        const habitsWithStreaks = data
          .filter((h: any) => h.currentStreak > 0)
          .sort((a: any, b: any) => b.currentStreak - a.currentStreak)
          .slice(0, 5)
        setHabits(habitsWithStreaks)
      }
    } catch (error) {
      console.error("Error fetching habits:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="text-gray-800 text-lg">Habit streaks</h3>
        </div>
        <Link href="/dashboard/habits">
          <Button variant="outline" size="sm">
            Voir tout
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : habits.length > 0 ? (
        <div className="space-y-3">
          {habits.map((habit, index) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{habit.name}</p>
                  <p className="text-xs text-gray-500">Current streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">{habit.currentStreak}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Flame className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No active streak</p>
        </div>
      )}
    </motion.div>
  )
}

