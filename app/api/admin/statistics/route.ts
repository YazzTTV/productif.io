import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUserAdmin } from "@/lib/admin-utils";

export async function GET() {
  try {
    // Vérifier l'authentification et les permissions
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }
    
    // Vérifier si l'utilisateur est un super admin
    const isSuperAdmin = await isUserAdmin(authUser.id, true);
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Vous n'avez pas les permissions nécessaires" },
        { status: 403 }
      );
    }

    // Récupérer le nombre total d'utilisateurs
    const totalUsers = await prisma.user.count();
    
    // Récupérer le nombre d'utilisateurs qui ont eu une activité récente (dans les 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Utilisateurs actifs (qui ont créé des tâches, des habitudes, ou des objectifs récemment)
    const activeUserIds = await prisma.$queryRaw<{ userId: string }[]>`
      SELECT DISTINCT "userId" FROM (
        SELECT "userId" FROM "Task" WHERE "createdAt" > ${thirtyDaysAgo}
        UNION
        SELECT "userId" FROM "habits" WHERE "createdAt" > ${thirtyDaysAgo}
        UNION 
        SELECT "userId" FROM "Mission" WHERE "createdAt" > ${thirtyDaysAgo}
      ) AS active_users
    `;
    const activeUsers = activeUserIds.length;

    // Récupérer le nombre d'utilisateurs actifs dans les 7 derniers jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyActiveUserIds = await prisma.$queryRaw<{ userId: string }[]>`
      SELECT DISTINCT "userId" FROM (
        SELECT "userId" FROM "Task" WHERE "createdAt" > ${sevenDaysAgo}
        UNION
        SELECT "userId" FROM "habits" WHERE "createdAt" > ${sevenDaysAgo}
        UNION 
        SELECT "userId" FROM "Mission" WHERE "createdAt" > ${sevenDaysAgo}
      ) AS weekly_active_users
    `;
    const weeklyActiveUsers = weeklyActiveUserIds.length;
    
    // Calculer le taux de croissance hebdomadaire (par rapport à la semaine précédente)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const previousWeekActiveUserIds = await prisma.$queryRaw<{ userId: string }[]>`
      SELECT DISTINCT "userId" FROM (
        SELECT "userId" FROM "Task" WHERE "createdAt" > ${twoWeeksAgo} AND "createdAt" < ${sevenDaysAgo}
        UNION
        SELECT "userId" FROM "habits" WHERE "createdAt" > ${twoWeeksAgo} AND "createdAt" < ${sevenDaysAgo}
        UNION 
        SELECT "userId" FROM "Mission" WHERE "createdAt" > ${twoWeeksAgo} AND "createdAt" < ${sevenDaysAgo}
      ) AS previous_week_active_users
    `;
    const previousWeekActiveUsers = previousWeekActiveUserIds.length;
    
    const weeklyGrowth = previousWeekActiveUsers > 0
      ? ((weeklyActiveUsers - previousWeekActiveUsers) / previousWeekActiveUsers) * 100
      : 0;
    
    // Nombre total d'entreprises
    const totalCompanies = await prisma.company.count();
    
    // Statistiques des tâches
    const totalTasks = await prisma.task.count();
    const completedTasks = await prisma.task.count({
      where: { completed: true }
    });
    
    // Statistiques des habitudes
    const totalHabits = await prisma.habit.count();
    
    // Habitudes actives (qui ont eu des entrées dans les 7 derniers jours)
    const activeHabitsData = await prisma.habitEntry.findMany({
      where: { 
        date: { gte: sevenDaysAgo }
      },
      distinct: ['habitId']
    });
    const activeHabits = activeHabitsData.length;
    
    // Statistiques des objectifs
    const totalObjectives = await prisma.objective.count();
    
    // Calculer la moyenne des progrès des objectifs
    const objectivesWithProgress = await prisma.objective.findMany({
      select: { progress: true }
    });
    
    let objectivesProgress = 0;
    if (objectivesWithProgress.length > 0) {
      const progressSum = objectivesWithProgress.reduce((sum, obj) => sum + obj.progress, 0);
      objectivesProgress = progressSum / objectivesWithProgress.length;
    }
    
    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalCompanies,
      totalTasks,
      completedTasks,
      totalHabits,
      activeHabits,
      totalObjectives,
      objectivesProgress,
      weeklyActiveUsers,
      monthlyActiveUsers: activeUsers,
      weeklyGrowth: parseFloat(weeklyGrowth.toFixed(1))
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
} 