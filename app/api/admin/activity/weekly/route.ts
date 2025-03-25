import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";
import { fr } from "date-fns/locale";

// Jours de la semaine en français abrégés
const DAYS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export async function GET() {
  try {
    // Vérifier l'authentification et les permissions
    const authUser = await getAuthUser();
    
    // Vérifier si l'utilisateur est un super admin
    if (!authUser || authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Vous n'avez pas les permissions nécessaires" },
        { status: 403 }
      );
    }

    // Calculer les 7 derniers jours
    const today = startOfDay(new Date());
    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const currentDate = subDays(today, i);
      const nextDate = subDays(today, i - 1);
      
      // Pour les tâches
      const tasksCount = await prisma.task.count({
        where: {
          updatedAt: {
            gte: currentDate,
            lt: i === 0 ? new Date() : nextDate
          },
          completed: true
        }
      });

      // Pour les habitudes
      const habitsCount = await prisma.habitEntry.count({
        where: {
          date: {
            gte: currentDate,
            lt: i === 0 ? new Date() : nextDate
          },
          completed: true
        }
      });

      // Pour les objectifs (actions terminées)
      const objectivesCount = await prisma.objectiveAction.count({
        where: {
          updatedAt: {
            gte: currentDate,
            lt: i === 0 ? new Date() : nextDate
          },
          progress: 100
        }
      });

      // Jour de la semaine (abréviation)
      const dayOfWeek = DAYS_SHORT[currentDate.getDay()];

      weeklyData.push({
        name: dayOfWeek,
        date: format(currentDate, "yyyy-MM-dd"),
        tasks: tasksCount,
        habits: habitsCount,
        objectives: objectivesCount
      });
    }

    return NextResponse.json({ weeklyData });
  } catch (error) {
    console.error("Erreur lors de la récupération des tendances hebdomadaires:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tendances hebdomadaires" },
      { status: 500 }
    );
  }
} 