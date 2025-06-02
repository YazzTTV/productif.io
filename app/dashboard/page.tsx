import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { RecentTasks } from "@/components/dashboard/recent-tasks"
import { ProjectsList } from "@/components/dashboard/projects-list"
import { getAuthUser } from "@/lib/auth"
import { OverviewMetrics } from "@/components/dashboard/overview-metrics"
import { HabitHeatmap } from "@/components/dashboard/habit-heatmap"
import HabitStats from "@/components/dashboard/habit-stats"
import { GamificationOverview } from "@/components/gamification/gamification-overview"
import { LeaderboardCompact } from "@/components/gamification/leaderboard-compact"

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
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Tableau de bord</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Bienvenue sur votre espace personnel. Retrouvez ici une vue d'ensemble de vos activités.
          </p>
        </div>

        {/* Métriques d'aperçu global */}
        <OverviewMetrics />

        {/* Graphiques et suivi */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 sm:gap-6">
          <HabitStats className="lg:col-span-1" />
        </div>

        {/* Grille responsive pour les modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Première rangée - 2 colonnes principales */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <RecentTasks />
              <GamificationOverview />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <ProjectsList projects={projects} />
              <HabitHeatmap />
            </div>
          </div>
          
          {/* Colonne latérale - Leaderboard */}
          <div className="lg:col-span-1">
            <LeaderboardCompact />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error loading dashboard:", error)
    redirect("/login")
  }
}

