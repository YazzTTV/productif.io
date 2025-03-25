"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

interface TaskCompletionChartProps {
  className?: string
}

interface CompletionData {
  date: string
  completed: number
  total: number
}

export function TaskCompletionChart({ className }: TaskCompletionChartProps) {
  const [data, setData] = useState<CompletionData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dashboard/task-completion")
        
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des données")
        }
        
        const chartData = await response.json()
        setData(chartData)
      } catch (error) {
        console.error("Erreur:", error)
        // Données fictives pour le développement
        setData([
          { date: "Lun", completed: 3, total: 5 },
          { date: "Mar", completed: 4, total: 6 },
          { date: "Mer", completed: 2, total: 7 },
          { date: "Jeu", completed: 5, total: 8 },
          { date: "Ven", completed: 6, total: 9 },
          { date: "Sam", completed: 2, total: 4 },
          { date: "Dim", completed: 1, total: 2 },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const completed = payload[0].value
      const total = payload[1].value
      const percentage = Math.round((completed / total) * 100) || 0
      
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-green-600">{`Terminées: ${completed}`}</p>
          <p className="text-sm text-blue-600">{`Total: ${total}`}</p>
          <p className="text-sm font-medium">{`Taux: ${percentage}%`}</p>
        </div>
      )
    }
  
    return null
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Progression des tâches</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Progression des tâches</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="completed"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name="Tâches terminées"
            />
            <Area
              type="monotone"
              dataKey="total"
              stackId="2"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              name="Total des tâches"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
} 