import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TimeByProjectChart } from "@/components/analytics/time-by-project-chart"
import { AnalyticsSummary } from "@/components/analytics/analytics-summary"
import { BackToDashboardButton } from "@/components/analytics/back-to-dashboard-button"
import { ProductivityChart } from "@/components/analytics/productivity-chart"
import { HabitStreaks } from "@/components/analytics/habit-streaks"
import { DeepWorkData } from "@/components/analytics/deepwork-data"
import { AnalyticsKpiGrid } from "@/components/analytics/analytics-kpi-grid"

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
    console.log("[ANALYTICS] Token décodé:", JSON.stringify(user))
  } catch (error) {
    console.error("[ANALYTICS] Erreur de vérification du token:", error)
    redirect("/login")
  }

  // Tenter de récupérer l'ID utilisateur des différentes façons possibles
  const userId = typeof user === 'object' ? (
    (user as any).userId || // Format standard de notre JWT
    (user as any).id ||     // Format alternatif
    (user as any).sub       // Format standard JWT
  ) : null;
  
  // Vérifier que l'ID utilisateur est bien défini
  if (!userId) {
    console.error("[ANALYTICS] ID utilisateur non trouvé dans le token:", JSON.stringify(user))
    redirect("/login")
  }

  // Log pour vérifier l'identité de l'utilisateur
  console.log(`[ANALYTICS] Chargement des statistiques pour l'utilisateur ID: ${userId}`)

  // Vérification: récupérer tous les projets de l'utilisateur qui sont VISIBLES (pas supprimés logiquement)
  const allUserProjects = await prisma.project.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          tasks: true
        }
      }
    }
  })
  
  console.log(`[ANALYTICS] Utilisateur ID utilisé pour filtrer: ${userId}`)
  
  // Filtrer pour avoir uniquement les projets avec des tâches
  const projectsWithTasks = allUserProjects.filter(p => p._count.tasks > 0)
  
  // On va directement utiliser les IDs récupérés de la page projets
  // Pour voir s'il y a une discordance entre les projets visibles et les projets en base
  console.log(`[ANALYTICS] ATTENTION - Projets trouvés: ${allUserProjects.length} mais l'interface n'en montre que 3`)
  
  // Pour déboguer, lister tous les noms de projets trouvés
  console.log(`[ANALYTICS] Liste des projets trouvés: ${allUserProjects.map(p => p.name).join(', ')}`)

  // Récupérer uniquement les tâches des projets valides
  const validProjectIds = projectsWithTasks.map(p => p.id)

  // 1. Temps par projet - utiliser une approche plus sûre quand il n'y a pas de projets
  let timeByProject: any = []
  
  // Premièrement, récupérer le temps passé sur des projets associés
  if (validProjectIds.length > 0) {
    timeByProject = await prisma.$queryRaw`
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
        AND p.id = ANY(${validProjectIds})
      GROUP BY p.id, p.name, p.color
      ORDER BY total_duration DESC
    `
    
    // Convertir les objets Decimal en nombres pour le passage aux composants client
    timeByProject = timeByProject.map((item: any) => ({
      ...item,
      total_duration: Number(item.total_duration)
    }));
  }
  
  // Ensuite, récupérer le temps passé sur des tâches sans projet
  const timeNoProject = await prisma.$queryRaw`
    SELECT 
      COALESCE(SUM(EXTRACT(EPOCH FROM (te."endTime" - te."startTime"))/3600), 0) as total_duration
    FROM "TimeEntry" te
    JOIN "Task" t ON te."taskId" = t.id
    WHERE t."userId" = ${userId}
      AND te."endTime" IS NOT NULL
      AND t."projectId" IS NULL
  `
  
  // Si du temps a été passé sur des tâches sans projet, ajouter une entrée au graphique
  const noProjectTime = Number((timeNoProject as any)[0]?.total_duration || 0);
  if (noProjectTime > 0) {
    timeByProject.push({
      id: "no-project",
      name: "No project",
      color: "#CBD5E1", // Couleur grise pour les tâches sans projet
      total_duration: noProjectTime
    });
  }
  
  // Log pour déboguer
  console.log(`[ANALYTICS] Temps passé sur des tâches sans projet: ${noProjectTime}h`)
  

  // 3. Statistiques générales - Calcul du temps total (requête plus directe)
  const totalTimeTracked = await prisma.$queryRaw`
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (te."endTime" - te."startTime"))/3600), 0) as total_duration
    FROM "TimeEntry" te
    LEFT JOIN "Task" t ON te."taskId" = t.id
    WHERE (te."userId" = ${userId} OR t."userId" = ${userId})
      AND te."endTime" IS NOT NULL
  `
  console.log(`[ANALYTICS] Temps total brut:`, JSON.stringify(totalTimeTracked))

  // Compter TOUTES les tâches de l'utilisateur, y compris celles sans projet
  const totalTasks = await prisma.task.count({
    where: {
      userId: userId,
      // Supprimer cette condition pour inclure toutes les tâches, même sans projet
      // projectId: { in: validProjectIds }
    },
  })

  // Compter toutes les tâches complétées, y compris celles sans projet
  const completedTasks = await prisma.task.count({
    where: {
      userId: userId,
      completed: true,
      // Supprimer cette condition pour inclure toutes les tâches complétées, même sans projet
      // projectId: { in: validProjectIds }
    },
  })

  // Ajouter des logs pour déboguer
  console.log(`[ANALYTICS] Nombre total de tâches (sans filtre de projet): ${totalTasks}`)
  console.log(`[ANALYTICS] Nombre de tâches complétées (sans filtre de projet): ${completedTasks}`)

  const stats = {
    totalTimeTracked: Number((totalTimeTracked as any)[0]?.total_duration || 0),
    totalProjects: allUserProjects.length,
    activeProjects: projectsWithTasks.length,
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  }

  // Log des statistiques pour débogage
  console.log(`[ANALYTICS] Statistiques calculées:`, JSON.stringify(stats))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-gray-800 text-3xl mb-2">Statistics</h1>
              <p className="text-gray-600 text-lg">Visualize your productivity and work time</p>
            </div>
            <BackToDashboardButton />
          </div>
        </div>

        {/* KPIs alignés avec l'app mobile (avg productivity, habits, focus, etc.) */}
        <div className="mb-8">
          <AnalyticsKpiGrid />
        </div>

        {/* Résumé détaillé basé sur le temps total et les projets */}
        <AnalyticsSummary stats={stats} />

        {/* Graphique de productivité */}
        <div className="mt-8">
          <ProductivityChart />
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Colonne gauche - 2 colonnes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Projets et temps */}
            <TimeByProjectChart data={timeByProject} />
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Streaks d'habitudes */}
            <HabitStreaks />

            {/* Deep Work Data */}
            <DeepWorkData />
          </div>
        </div>
      </div>
    </div>
  )
}

