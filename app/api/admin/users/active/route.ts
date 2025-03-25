import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Période de calcul: 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        companies: {
          include: {
            company: true
          }
        }
      }
    });

    // Pour chaque utilisateur, calculer ses statistiques d'activité
    const activeUsers = await Promise.all(
      users.map(async (user) => {
        // Nombre de tâches complétées dans les 30 derniers jours
        const tasksCompleted = await prisma.task.count({
          where: {
            userId: user.id,
            completed: true,
            updatedAt: {
              gte: thirtyDaysAgo
            }
          }
        });

        // Calculer le streak d'habitudes (jours consécutifs)
        // On récupère toutes les entrées d'habitudes de l'utilisateur
        const habitEntries = await prisma.habitEntry.findMany({
          where: {
            habit: {
              userId: user.id
            },
            completed: true
          },
          orderBy: {
            date: 'desc'
          },
          include: {
            habit: true
          }
        });

        // Calculer le streak d'habitudes (nombre de jours consécutifs les plus récents)
        let habitsStreak = 0;
        if (habitEntries.length > 0) {
          // Regrouper les entrées par jour
          const entriesByDay = new Map();
          
          habitEntries.forEach(entry => {
            const dateStr = entry.date.toISOString().split('T')[0];
            if (!entriesByDay.has(dateStr)) {
              entriesByDay.set(dateStr, []);
            }
            entriesByDay.get(dateStr).push(entry);
          });
          
          // Trier les dates par ordre décroissant
          const dates = Array.from(entriesByDay.keys()).sort().reverse();
          
          // Compter les jours consécutifs
          if (dates.length > 0) {
            habitsStreak = 1; // Au moins un jour
            
            for (let i = 1; i < dates.length; i++) {
              const currentDate = new Date(dates[i-1]);
              const prevDate = new Date(dates[i]);
              
              // Calculer la différence en jours
              const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                habitsStreak++;
              } else {
                break;
              }
            }
          }
        }

        // Calcul du progrès des objectifs
        const objectives = await prisma.objective.findMany({
          where: {
            mission: {
              userId: user.id
            }
          },
          select: {
            progress: true
          }
        });

        let objectivesProgress = 0;
        if (objectives.length > 0) {
          const totalProgress = objectives.reduce((sum, obj) => sum + obj.progress, 0);
          objectivesProgress = Math.round(totalProgress / objectives.length);
        }

        return {
          id: user.id,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          companyName: user.companies.length > 0 ? user.companies[0].company.name : null,
          tasksCompleted,
          habitsStreak,
          objectivesProgress
        };
      })
    );

    // Trier par nombre de tâches complétées (décroissant)
    const sortedUsers = activeUsers
      .sort((a, b) => {
        // Critère principal: tâches complétées
        if (b.tasksCompleted !== a.tasksCompleted) {
          return b.tasksCompleted - a.tasksCompleted;
        }
        // Critère secondaire: habitsStreak
        if (b.habitsStreak !== a.habitsStreak) {
          return b.habitsStreak - a.habitsStreak;
        }
        // Critère tertiaire: objectivesProgress
        return b.objectivesProgress - a.objectivesProgress;
      })
      .slice(0, 10); // Prendre les 10 premiers

    return NextResponse.json({ users: sortedUsers });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs actifs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs actifs" },
      { status: 500 }
    );
  }
} 