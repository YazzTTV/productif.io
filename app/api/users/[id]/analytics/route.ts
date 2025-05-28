import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier si l'utilisateur est super admin
    const isSuperAdmin = await prisma.$queryRaw`
      SELECT role FROM "User" WHERE id = ${authUser.id} AND role = 'SUPER_ADMIN'
    `
    
    if (!Array.isArray(isSuperAdmin) || isSuperAdmin.length === 0) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const userId = params.id

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // 1. Analyse des tâches les moins complétées
    const taskAnalysis = await prisma.$queryRaw`
      SELECT 
        t.title,
        t.priority,
        t.category,
        COUNT(*) as total_count,
        SUM(CASE WHEN t.completed = true THEN 1 ELSE 0 END) as completed_count,
        ROUND(
          (SUM(CASE WHEN t.completed = true THEN 1 ELSE 0 END)::float / COUNT(*)) * 100, 
          2
        ) as completion_rate
      FROM "Task" t
      WHERE t."userId" = ${userId}
      GROUP BY t.title, t.priority, t.category
      HAVING COUNT(*) >= 2
      ORDER BY completion_rate ASC, total_count DESC
      LIMIT 10
    `

    // 2. Analyse des habitudes et corrélation avec les notes journalières
    const habitCorrelation = await prisma.$queryRaw`
      SELECT 
        h.title as habit_title,
        h.frequency,
        COUNT(he.id) as total_entries,
        SUM(CASE WHEN he.completed = true THEN 1 ELSE 0 END) as completed_entries,
        ROUND(
          (SUM(CASE WHEN he.completed = true THEN 1 ELSE 0 END)::float / COUNT(he.id)) * 100, 
          2
        ) as completion_rate,
        AVG(CASE WHEN he.completed = true THEN COALESCE(de.mood_score, 0) ELSE 0 END) as avg_mood_when_completed,
        AVG(CASE WHEN he.completed = false THEN COALESCE(de.mood_score, 0) ELSE 0 END) as avg_mood_when_not_completed
      FROM "habits" h
      LEFT JOIN "habit_entries" he ON h.id = he."habitId"
      LEFT JOIN "daily_entries" de ON DATE(he.date) = DATE(de.date) AND de."userId" = ${userId}
      WHERE h."userId" = ${userId}
      GROUP BY h.id, h.title, h.frequency
      HAVING COUNT(he.id) >= 5
      ORDER BY completion_rate DESC
    `

    // 3. Statistiques temporelles (derniers 30 jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const temporalStats = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as tasks_created,
        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as tasks_completed,
        ROUND(
          (SUM(CASE WHEN completed = true THEN 1 ELSE 0 END)::float / COUNT(*)) * 100, 
          2
        ) as daily_completion_rate
      FROM "Task"
      WHERE "userId" = ${userId} 
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `

    // 4. Analyse des projets
    const projectAnalysis = await prisma.$queryRaw`
      SELECT 
        p.name as project_name,
        p.description,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.completed = true THEN 1 ELSE 0 END) as completed_tasks,
        ROUND(
          (SUM(CASE WHEN t.completed = true THEN 1 ELSE 0 END)::float / COUNT(t.id)) * 100, 
          2
        ) as project_completion_rate,
        AVG(EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/86400) as avg_task_duration_days
      FROM "Project" p
      LEFT JOIN "Task" t ON p.id = t."projectId"
      WHERE p."userId" = ${userId}
      GROUP BY p.id, p.name, p.description
      HAVING COUNT(t.id) > 0
      ORDER BY project_completion_rate DESC
    `

    // 5. Analyse des patterns de productivité par jour de la semaine
    const weeklyPatterns = await prisma.$queryRaw`
      SELECT 
        EXTRACT(DOW FROM created_at) as day_of_week,
        COUNT(*) as tasks_created,
        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as tasks_completed,
        ROUND(
          (SUM(CASE WHEN completed = true THEN 1 ELSE 0 END)::float / COUNT(*)) * 100, 
          2
        ) as completion_rate
      FROM "Task"
      WHERE "userId" = ${userId}
      GROUP BY EXTRACT(DOW FROM created_at)
      ORDER BY day_of_week
    `

    // 6. Analyse des notes journalières et mood
    const moodAnalysis = await prisma.$queryRaw`
      SELECT 
        AVG(mood_score) as avg_mood,
        MIN(mood_score) as min_mood,
        MAX(mood_score) as max_mood,
        COUNT(*) as total_entries,
        AVG(productivity_score) as avg_productivity,
        COUNT(CASE WHEN mood_score >= 8 THEN 1 END) as great_days,
        COUNT(CASE WHEN mood_score <= 4 THEN 1 END) as difficult_days
      FROM "daily_entries"
      WHERE "userId" = ${userId}
        AND created_at >= ${thirtyDaysAgo}
    `

    // 7. Top 3 des catégories de tâches les plus utilisées
    const topCategories = await prisma.$queryRaw`
      SELECT 
        category,
        COUNT(*) as task_count,
        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed_count,
        ROUND(
          (SUM(CASE WHEN completed = true THEN 1 ELSE 0 END)::float / COUNT(*)) * 100, 
          2
        ) as completion_rate
      FROM "Task"
      WHERE "userId" = ${userId} AND category IS NOT NULL
      GROUP BY category
      ORDER BY task_count DESC
      LIMIT 5
    `

    // 8. Analyse des délais de completion
    const completionTimeAnalysis = await prisma.$queryRaw`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_completion_hours,
        MIN(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as min_completion_hours,
        MAX(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as max_completion_hours,
        COUNT(*) as completed_tasks_with_time
      FROM "Task"
      WHERE "userId" = ${userId} 
        AND completed = true 
        AND updated_at > created_at
    `

    const analytics = {
      user: targetUser,
      taskAnalysis: taskAnalysis || [],
      habitCorrelation: habitCorrelation || [],
      temporalStats: temporalStats || [],
      projectAnalysis: projectAnalysis || [],
      weeklyPatterns: weeklyPatterns || [],
      moodAnalysis: Array.isArray(moodAnalysis) && moodAnalysis.length > 0 ? moodAnalysis[0] : null,
      topCategories: topCategories || [],
      completionTimeAnalysis: Array.isArray(completionTimeAnalysis) && completionTimeAnalysis.length > 0 ? completionTimeAnalysis[0] : null
    }

    return NextResponse.json({ analytics })

  } catch (error) {
    console.error("Erreur lors de la récupération des analytics:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
} 