"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface TimeByDayData {
  day_of_week: number
  total_duration: number
}

interface TimeByDayChartProps {
  data: TimeByDayData[]
}

export function TimeByDayChart({ data }: TimeByDayChartProps) {
  // Convertir le numéro du jour en nom du jour
  const getDayName = (dayNum: number) => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    return days[dayNum];
  };

  // Formater les données pour le graphique
  const chartData = data.map((item) => ({
    name: getDayName(Number(item.day_of_week)),
    value: Number(item.total_duration),
  }))

  // Personnaliser le tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const hours = Math.floor(payload[0].value)
      const minutes = Math.round((payload[0].value - hours) * 60)

      return (
        <div className="bg-card text-card-foreground p-2 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{`${hours}h ${minutes}m`}</p>
        </div>
      )
    }

    return null
  }

  return (
    <Card className="stat-card">
      <CardHeader>
        <CardTitle>Temps par jour</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">Aucune donnée disponible</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                label={{
                  value: "Heures",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

