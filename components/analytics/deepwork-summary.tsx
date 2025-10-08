"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Activity, Timer } from "lucide-react"

interface DeepWorkSummaryProps {
  weekHours: number
  allTimeHours: number
  sessionsThisWeek: number
  avgSessionMinutes?: number
}

export function DeepWorkSummary({ weekHours, allTimeHours, sessionsThisWeek, avgSessionMinutes }: DeepWorkSummaryProps) {
  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return `${wholeHours}h ${minutes}m`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="stat-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Deep Work (7 jours)</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatHours(weekHours)}</div>
          <p className="text-xs text-muted-foreground mt-1">Temps total sur 7 jours</p>
        </CardContent>
      </Card>

      <Card className="stat-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Sessions (7 jours)</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sessionsThisWeek}</div>
          <p className="text-xs text-muted-foreground mt-1">Sessions terminées</p>
        </CardContent>
      </Card>

      <Card className="stat-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Deep Work (Total)</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatHours(allTimeHours)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {typeof avgSessionMinutes === 'number' ? `~${Math.round(avgSessionMinutes)} min/séance en moyenne` : 'Total cumulé'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


