import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, FolderKanban, ListTodo, CheckCircle } from "lucide-react"

interface AnalyticsSummaryProps {
  stats: {
    totalTimeTracked: number
    totalProjects: number
    activeProjects?: number
    totalTasks: number
    completedTasks: number
    completionRate: number
  }
}

export function AnalyticsSummary({ stats }: AnalyticsSummaryProps) {
  // Formater le temps total (format: XXh XXm)
  const formatTotalTime = (hours: number) => {
    // Le temps est déjà en heures, pas en secondes
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)

    return `${wholeHours}h ${minutes}m`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="stat-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Temps total suivi</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTotalTime(stats.totalTimeTracked)}</div>
          <p className="text-xs text-muted-foreground mt-1">Temps total enregistré</p>
        </CardContent>
      </Card>

      <Card className="stat-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Projets</CardTitle>
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProjects}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.activeProjects !== undefined ? 
             `${stats.activeProjects} projets actifs sur ${stats.totalProjects}` : 
             'Projets créés'}
          </p>
        </CardContent>
      </Card>

      <Card className="stat-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tâches</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTasks}</div>
          <p className="text-xs text-muted-foreground mt-1">{stats.completedTasks} tâches complétées</p>
        </CardContent>
      </Card>

      <Card className="stat-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completionRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">Des tâches terminées</p>
        </CardContent>
      </Card>
    </div>
  )
}

