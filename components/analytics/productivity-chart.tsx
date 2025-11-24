"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"

type Period = "day" | "week" | "month" | "trimester" | "year"

export function ProductivityChart() {
  const [period, setPeriod] = useState<Period>("week")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dashboard/weekly-productivity?period=${period}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.chartData || result.weeklyData || [])
      }
    } catch (error) {
      console.error("Error fetching productivity data:", error)
    } finally {
      setLoading(false)
    }
  }

  const periods: { value: Period; label: string }[] = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "trimester", label: "Quarter" },
    { value: "year", label: "Year" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-gray-800 text-xl mb-1">Productivity</h3>
          <p className="text-gray-500 text-sm">Your productivity score</p>
        </div>
        <div className="flex items-center gap-2">
          {periods.map((p) => (
            <motion.button
              key={p.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                period === p.value
                  ? "bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </motion.button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C27A]"></div>
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "8px 12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#00C27A"
              strokeWidth={3}
              dot={{ fill: "#00C27A", r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No data available</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

