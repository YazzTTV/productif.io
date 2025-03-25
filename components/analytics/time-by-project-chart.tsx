"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  // Formater le temps (format: XXh XXm)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    return `${hours}h ${minutes}m`
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
    <Card className="stat-card">
      <CardHeader>
        <CardTitle>Temps par projet</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">Aucune donnée disponible</div>
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
      </CardContent>
    </Card>
  )
}

