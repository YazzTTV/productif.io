import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TimeByProjectChart } from "@/components/analytics/time-by-project-chart"
import { TimeByDayChart } from "@/components/analytics/time-by-day-chart"
import { AnalyticsSummary } from "@/components/analytics/analytics-summary"

export default async function AnalyticsPage() {
  // Vérifier l'authentification côté serveur
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    redirect("/login")
  }

  let user
  try {
    user = verify(token, process.env.JWT_SECRET || "fallback_secret")
  } catch (error) {
    redirect("/login")
  }

  const userId = (user as any).id

  // Récupérer les données pour les graphiques

  // 1. Temps par projet
  const timeByProject = await prisma.$queryRaw`
    SELECT 
      p.id,
      p.name,
      p.color,
      COALESCE(SUM(EXTRACT(EPOCH FROM (te."endTime" - te."startTime"))/3600), 0) as total_duration
    FROM "Project" p
    LEFT JOIN "Task" t ON t."projectId" = p.id
    LEFT JOIN "TimeEntry" te ON te."taskId" = t.id
    WHERE p."userId" = ${userId}
      AND te."endTime" IS NOT NULL
    GROUP BY p.id, p.name, p.color
    ORDER BY total_duration DESC
  `

  // 2. Temps par jour de la semaine
  const timeByDay = await prisma.$queryRaw`
    SELECT 
      EXTRACT(DOW FROM te."startTime") as day_of_week,
      SUM(EXTRACT(EPOCH FROM (te."endTime" - te."startTime"))/3600) as total_duration
    FROM "TimeEntry" te
    JOIN "Task" t ON t.id = te."taskId"
    WHERE t."userId" = ${userId}
      AND te."endTime" IS NOT NULL
    GROUP BY day_of_week
    ORDER BY day_of_week
  `

  // 3. Statistiques générales
  const totalTimeTracked = await prisma.$queryRaw`
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (te."endTime" - te."startTime"))/3600), 0) as total_duration
    FROM "TimeEntry" te
    WHERE te."userId" = ${userId}
      AND te."endTime" IS NOT NULL
  `

  const totalProjects = await prisma.project.count({
    where: {
      userId: userId,
    },
  })

  const totalTasks = await prisma.task.count({
    where: {
      userId: userId,
    },
  })

  const completedTasks = await prisma.task.count({
    where: {
      userId: userId,
      completed: true,
    },
  })

  const stats = {
    totalTimeTracked: (totalTimeTracked as any)[0].total_duration || 0,
    totalProjects,
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-gray-600 mt-1">Visualisez votre productivité et votre temps de travail</p>
      </div>

      <AnalyticsSummary stats={stats} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <TimeByProjectChart data={timeByProject as any} />
        <TimeByDayChart data={timeByDay as any} />
      </div>
    </div>
  )
}

