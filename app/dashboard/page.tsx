import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { RecentTasks } from "@/components/dashboard/recent-tasks"
import { ProjectsList } from "@/components/dashboard/projects-list"
import { RecentHabits } from "@/components/dashboard/recent-habits"
import { getAuthUser } from "@/lib/auth"
import { OverviewMetrics } from "@/components/dashboard/overview-metrics"
import { TaskCompletionChart } from "@/components/dashboard/task-completion-chart"
import { HabitHeatmap } from "@/components/dashboard/habit-heatmap"
import { ObjectivesProgress } from "@/components/dashboard/objectives-progress"
import HabitStats from "@/components/dashboard/habit-stats"

export default async function DashboardPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
      include: {
        _count: {
          select: {
            tasks: {
              where: {
                completed: false,
              },
            },
          },
        },
      },
    })

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Tableau de bord</h1>
          <p className="text-gray-600">
            Bienvenue sur votre espace personnel. Retrouvez ici une vue d'ensemble de vos activités.
          </p>
        </div>

        {/* Métriques d'aperçu global */}
        <OverviewMetrics />

        {/* Graphiques et suivi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TaskCompletionChart />
          <HabitStats />
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentTasks />
            <ProjectsList projects={projects} />
          </div>

          <div className="space-y-6">
            <ObjectivesProgress />
            <RecentHabits />
            <HabitHeatmap />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error loading dashboard:", error)
    redirect("/login")
  }
}

