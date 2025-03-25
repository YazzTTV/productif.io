import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

interface UserStats {
  tasksTotal: number;
  tasksCompleted: number;
  tasksOverdue: number;
  tasksCompletionRate: number;
  projectsTotal: number;
  projectsCompleted: number;
  habitsTotal: number;
  habitsCompletedToday: number;
  objectivesTotal: number;
  objectivesProgress: number;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Récupération des statistiques pour l'utilisateur:", params.id);
    
    // Vérifier l'authentification de l'utilisateur actuel
    const authUser = await getAuthUser();
    if (!authUser) {
      console.log("Non authentifié");
      return NextResponse.json(
        { error: "Vous devez être connecté pour accéder à cette ressource" },
        { status: 401 }
      );
    }

    console.log("Utilisateur authentifié:", authUser.id);

    // Vérifier que l'utilisateur est un SUPER_ADMIN
    const isSuperAdmin = await prisma.$queryRaw`
      SELECT role FROM "User" WHERE id = ${authUser.id} AND role = 'SUPER_ADMIN'
    `;

    console.log("Résultat vérification super admin:", isSuperAdmin);

    if (!Array.isArray(isSuperAdmin) || isSuperAdmin.length === 0) {
      console.log("L'utilisateur n'est pas super admin");
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour accéder à cette ressource" },
        { status: 403 }
      );
    }

    // Récupérer l'utilisateur cible
    const targetUser = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE id = ${params.id}
    `;

    console.log("Résultat recherche utilisateur cible:", targetUser);

    if (!Array.isArray(targetUser) || targetUser.length === 0) {
      console.log("Utilisateur cible non trouvé");
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    console.log("Calcul des statistiques");
    
    // Obtenir la date du jour (sans l'heure)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Statistiques des tâches
    const tasksTotal = await prisma.task.count({
      where: {
        userId: params.id
      }
    });
    
    const tasksCompleted = await prisma.task.count({
      where: {
        userId: params.id,
        completed: true
      }
    });
    
    const tasksOverdue = await prisma.task.count({
      where: {
        userId: params.id,
        completed: false,
        dueDate: {
          lt: new Date()
        }
      }
    });
    
    const tasksCompletionRate = tasksTotal > 0 
      ? Math.round((tasksCompleted / tasksTotal) * 100) 
      : 0;
    
    // Statistiques des projets
    const projectsTotal = await prisma.project.count({
      where: {
        userId: params.id
      }
    });
    
    // Nombre de projets complétés (en comptant le nombre de tâches complétées par projet)
    const projectsWithTasks = await prisma.project.findMany({
      where: {
        userId: params.id
      },
      include: {
        tasks: {
          select: {
            completed: true
          }
        }
      }
    });
    
    const projectsCompleted = projectsWithTasks.filter(project => {
      if (project.tasks.length === 0) return false;
      return project.tasks.every(task => task.completed);
    }).length;
    
    // Statistiques des habitudes
    const habitsTotal = await prisma.habit.count({
      where: {
        userId: params.id
      }
    });
    
    // Habitudes complétées aujourd'hui
    const habitsCompletedToday = await prisma.habitEntry.count({
      where: {
        habit: {
          userId: params.id
        },
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Demain
        },
        completed: true
      }
    });
    
    // Statistiques des objectifs
    const missions = await prisma.mission.findMany({
      where: {
        userId: params.id
      },
      include: {
        objectives: true
      }
    });
    
    const objectivesTotal = missions.reduce((total, mission) => 
      total + mission.objectives.length, 0);
    
    // Calculer la progression moyenne des objectifs
    const objectivesProgress = objectivesTotal > 0 
      ? Math.round(
        missions.reduce((sum, mission) => 
          sum + mission.objectives.reduce((objSum, obj) => objSum + obj.progress, 0), 
          0
        ) / objectivesTotal
      ) 
      : 0;
    
    // Assembler toutes les statistiques
    const stats: UserStats = {
      tasksTotal,
      tasksCompleted,
      tasksOverdue,
      tasksCompletionRate,
      projectsTotal,
      projectsCompleted,
      habitsTotal,
      habitsCompletedToday,
      objectivesTotal,
      objectivesProgress
    };
    
    console.log("Statistiques calculées:", stats);
    
    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { 
        error: "Une erreur est survenue lors de la récupération des statistiques",
        stats: {
          tasksTotal: 0,
          tasksCompleted: 0,
          tasksOverdue: 0,
          tasksCompletionRate: 0,
          projectsTotal: 0,
          projectsCompleted: 0,
          habitsTotal: 0,
          habitsCompletedToday: 0,
          objectivesTotal: 0,
          objectivesProgress: 0
        }
      },
      { status: 500 }
    );
  }
} 