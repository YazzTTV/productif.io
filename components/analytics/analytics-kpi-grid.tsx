"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, CheckCircle2, Flame, Clock } from "lucide-react"

type TimePeriod = "week" | "month" | "trimester" | "year"

interface AnalyticsKpiStats {
  avgProductivity: number
  totalTasks: number
  habitsCompletion: number
  focusHours: number
}

export function AnalyticsKpiGrid() {
  const [period, setPeriod] = useState<TimePeriod>("week")
  const [stats, setStats] = useState<AnalyticsKpiStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/dashboard/analytics-stats?period=${period}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des analytics")
        }

        const data = await response.json()
        setStats(data.stats || { avgProductivity: 0, totalTasks: 0, habitsCompletion: 0, focusHours: 0 })
      } catch (err) {
        console.error("Erreur chargement analytics stats:", err)
        setError("Impossible de charger les analytics")
        setStats({ avgProductivity: 0, totalTasks: 0, habitsCompletion: 0, focusHours: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [period])

  const periods: { value: TimePeriod; label: string }[] = [
    { value: "week", label: "Semaine" },
    { value: "month", label: "Mois" },
    { value: "trimester", label: "Trimestre" },
    { value: "year", label: "Année" },
  ]

  return (
    <div className="space-y-4">
      {/* Sélecteur de période (comme sur mobile) */}
      <div className="flex flex-wrap gap-2 justify-end">
        {periods.map((p) => (
          <motion.button
            key={p.value}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              period === p.value
                ? "bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </motion.button>
        ))}
      </div>

      {/* Grille de KPIs alignée avec l'app mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Avg Productivity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#00C27A]" />
              <p className="text-sm text-gray-600">Avg Productivity</p>
            </div>
          </div>
          <p className="text-4xl font-semibold text-gray-900">
            {loading ? "--" : `${stats?.avgProductivity ?? 0}%`}
          </p>
          <p className="text-xs text-gray-500 mt-1">Score moyen sur la période</p>
        </motion.div>

        {/* Total tasks (complétées sur la période) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-gray-600">Total Tasks</p>
          </div>
          <p className="text-4xl font-semibold text-gray-900">
            {loading ? "--" : stats?.totalTasks ?? 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Tâches complétées sur la période</p>
        </motion.div>

        {/* Habits tracked / completion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-5 w-5 text-orange-500" />
            <p className="text-sm text-gray-600">Habits Tracked</p>
          </div>
          <p className="text-4xl font-semibold text-gray-900">
            {loading ? "--" : `${stats?.habitsCompletion ?? 0}%`}
          </p>
          <p className="text-xs text-gray-500 mt-1">Taux moyen de complétion des habitudes</p>
        </motion.div>

        {/* Focus hours (deep work) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-purple-600" />
            <p className="text-sm text-gray-600">Focus Hours</p>
          </div>
          <p className="text-4xl font-semibold text-gray-900">
            {loading ? "--" : `${stats?.focusHours ?? 0}h`}
          </p>
          <p className="text-xs text-gray-500 mt-1">Heures de deep work sur la période</p>
        </motion.div>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  )
}




