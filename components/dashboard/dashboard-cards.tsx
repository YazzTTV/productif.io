import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, FolderKanban, ListTodo } from "lucide-react"

interface DashboardCardsProps {
  stats: {
    tasks: {
      todo: number
      inProgress: number
      done: number
    }
    totalTasks: number
    projects: number
    timeTracked: string
  }
}

export function DashboardCards({ stats }: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tâches totales</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTasks}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.tasks.todo} à faire, {stats.tasks.inProgress} en cours, {stats.tasks.done} terminées
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tâches terminées</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tasks.done}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalTasks > 0
              ? `${Math.round((stats.tasks.done / stats.totalTasks) * 100)}% de vos tâches`
              : "Aucune tâche créée"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Projets actifs</CardTitle>
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.projects}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.projects === 0
              ? "Aucun projet créé"
              : stats.projects === 1
                ? "1 projet actif"
                : `${stats.projects} projets actifs`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Temps cette semaine</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.timeTracked}</div>
          <p className="text-xs text-muted-foreground mt-1">Temps total suivi cette semaine</p>
        </CardContent>
      </Card>
    </div>
  )
}

