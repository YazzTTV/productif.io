"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, Activity, Timer, Zap } from "lucide-react"

interface DeepWorkData {
  today: {
    hours: number
    seconds: number
    sessions: number
  }
  week: {
    hours: number
    seconds: number
    sessions: number
  }
  allTime: {
    hours: number
    seconds: number
    sessions: number
  }
  bestSession: string
  bestSessionSeconds: number
}

export function DeepWorkData() {
  const [data, setData] = useState<DeepWorkData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/dashboard/deepwork-stats")
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("Error fetching deep work data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return `${wholeHours}h ${minutes}m`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex items-center gap-2 mb-6">
        <Zap className="h-5 w-5 text-[#00C27A]" />
        <h3 className="text-gray-800 text-lg">Deep Work</h3>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Aujourd'hui */}
          <div className="p-4 bg-gradient-to-r from-[#00C27A]/10 to-[#00D68F]/10 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#00C27A]" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Today</p>
                  <p className="text-xs text-gray-500">{data.today?.sessions || 0} sessions</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-[#00C27A]">
                {formatHours(data.today?.hours || 0)}
              </p>
            </div>
          </div>

          {/* Cette semaine */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">This week</p>
                  <p className="text-xs text-gray-500">{data.week?.sessions || 0} sessions</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {formatHours(data.week?.hours || 0)}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-600/10 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Total</p>
                  <p className="text-xs text-gray-500">{data.allTime?.sessions || 0} sessions</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {formatHours(data.allTime?.hours || 0)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Zap className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No data available</p>
        </div>
      )}
    </motion.div>
  )
}

