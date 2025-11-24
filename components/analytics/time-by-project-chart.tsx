"use client"

import { motion } from "framer-motion"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface TimeByProjectData {
  id: string
  name: string
  color: string | null
  total_duration: number
}

interface TimeByProjectChartProps {
  data: TimeByProjectData[]
}

export function TimeByProjectChart({ data }: TimeByProjectChartProps) {
  // Formater les données pour le graphique
  const chartData = data.map((item) => ({
    name: item.name,
    value: Number(item.total_duration),
    color: item.color || "#6366F1",
  }))

  // Formater le temps (format: XXh XXm) - les données sont déjà en heures
  const formatTime = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return `${wholeHours}h ${minutes}m`
  }

  // Personnaliser le tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card text-card-foreground p-2 border rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">{formatTime(payload[0].value)}</p>
        </div>
      )
    }

    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
    >
      <h3 className="text-gray-800 text-xl mb-6">Projects and time</h3>
      <div className="h-80">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => <span className="text-sm">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  )
}

