import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { subDays, subMonths, subWeeks, startOfDay, endOfDay } from "date-fns";

interface HabitCorrelation {
  habitId: string;
  habitName: string;
  correlation: number;
  completionDays: number;
  nonCompletionDays: number;
  avgRatingWhenCompleted: number;
  avgRatingWhenNotCompleted: number;
  impactScore: number;
  regularity: number; // Pourcentage de régularité
}

interface AutoInsights {
  patterns: string[];
  alarms: string[];
  recommendations: {
    maintain: string[];
    adjust: string[];
    opportunities: string[];
  };
}

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
  habitCorrelations: HabitCorrelation[];
  totalDaysWithRatings: number;
  autoInsights: AutoInsights;
  dateRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

// Fonction pour générer des insights automatiques
function generateAutoInsights(correlations: HabitCorrelation[], totalDays: number): AutoInsights {
  const patterns: string[] = [];
  const alarms: string[] = [];
  const recommendations = {
    maintain: [] as string[],
    adjust: [] as string[],
    opportunities: [] as string[]
  };

  // Identifier les patterns de routine matinale
  const morningHabits = correlations.filter(h => 
    h.habitName.toLowerCase().includes('café') ||
    h.habitName.toLowerCase().includes('eau') ||
    h.habitName.toLowerCase().includes('douche') ||
    h.habitName.toLowerCase().includes('petit') ||
    h.habitName.toLowerCase().includes('lever')
  );

  const goodMorningHabits = morningHabits.filter(h => h.impactScore > 2);
  if (goodMorningHabits.length >= 3) {
    patterns.push(`Routine matinale excellente : ${goodMorningHabits.length} habitudes matinales avec impact positif fort`);
    recommendations.maintain.push("Routine matinale (maintenir absolument)");
  }

  // Identifier les habitudes très impactantes mais irrégulières
  const highImpactIrregular = correlations.filter(h => 
    h.impactScore > 3 && h.regularity < 60
  );

  highImpactIrregular.forEach(habit => {
    patterns.push(`"${habit.habitName}" → +${habit.impactScore.toFixed(1)} (très impactant mais fait seulement ${habit.completionDays}/${totalDays} jours)`);
    recommendations.opportunities.push(`"${habit.habitName}" → augmenter la régularité`);
  });

  // Identifier les habitudes problématiques
  const negativeHabits = correlations.filter(h => h.impactScore < -1);
  negativeHabits.forEach(habit => {
    alarms.push(`"${habit.habitName}" → Impact négatif (${habit.impactScore.toFixed(1)})`);
    recommendations.adjust.push(`Revoir "${habit.habitName}" (impact négatif détecté)`);
  });

  // Identifier les habitudes liées aux écrans/technologie
  const screenHabits = correlations.filter(h => 
    h.habitName.toLowerCase().includes('écran') ||
    h.habitName.toLowerCase().includes('réseaux') ||
    h.habitName.toLowerCase().includes('téléphone')
  );

  screenHabits.forEach(habit => {
    if (habit.impactScore > 2) {
      patterns.push(`Gestion des écrans efficace : "${habit.habitName}" → +${habit.impactScore.toFixed(1)}`);
      recommendations.maintain.push("Limitation des écrans");
    }
  });

  // Identifier les habitudes de travail
  const workHabits = correlations.filter(h => 
    h.habitName.toLowerCase().includes('work') ||
    h.habitName.toLowerCase().includes('tâche') ||
    h.habitName.toLowerCase().includes('planifier')
  );

  const positiveWorkHabits = workHabits.filter(h => h.impactScore > 2);
  if (positiveWorkHabits.length > 0) {
    patterns.push(`Organisation du travail bénéfique : ${positiveWorkHabits.length} habitudes de travail positives`);
  }

  // Identifier les habitudes de sommeil problématiques
  const sleepHabits = correlations.filter(h => 
    h.habitName.toLowerCase().includes('coucher') ||
    h.habitName.toLowerCase().includes('dormir')
  );

  sleepHabits.forEach(habit => {
    if (habit.impactScore < 0) {
      alarms.push(`Horaires de sommeil : "${habit.habitName}" semble trop rigide ou inadapté`);
      recommendations.adjust.push("Assouplir les horaires de coucher");
    }
  });

  // Identifier les habitudes de sport/santé
  const healthHabits = correlations.filter(h => 
    h.habitName.toLowerCase().includes('sport') ||
    h.habitName.toLowerCase().includes('pompes') ||
    h.habitName.toLowerCase().includes('marche') ||
    h.habitName.toLowerCase().includes('alcool') ||
    h.habitName.toLowerCase().includes('fumer')
  );

  const positiveHealthHabits = healthHabits.filter(h => h.impactScore > 1);
  if (positiveHealthHabits.length > 0) {
    patterns.push(`Habitudes santé bénéfiques : ${positiveHealthHabits.length} habitudes liées au bien-être physique`);
  }

  return { patterns, alarms, recommendations };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;
    console.log("Récupération des statistiques pour l'utilisateur:", id);
    
    // Récupérer les paramètres de requête pour la plage de dates
    const url = new URL(request.url);
    const dateRange = url.searchParams.get('range') || '30d'; // Par défaut 30 jours
    const customStart = url.searchParams.get('startDate');
    const customEnd = url.searchParams.get('endDate');

    // Calculer les dates de début et fin
    let startDate: Date;
    let endDate: Date = endOfDay(new Date());

    if (customStart && customEnd) {
      startDate = startOfDay(new Date(customStart));
      endDate = endOfDay(new Date(customEnd));
    } else {
      switch (dateRange) {
        case '7d':
          startDate = startOfDay(subDays(new Date(), 7));
          break;
        case '30d':
          startDate = startOfDay(subDays(new Date(), 30));
          break;
        case '3m':
          startDate = startOfDay(subMonths(new Date(), 3));
          break;
        case '6m':
          startDate = startOfDay(subMonths(new Date(), 6));
          break;
        case '1y':
          startDate = startOfDay(subMonths(new Date(), 12));
          break;
        default:
          startDate = startOfDay(subDays(new Date(), 30));
      }
    }

    const totalDaysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`Analyse pour la période: ${startDate.toISOString()} à ${endDate.toISOString()} (${totalDaysInRange} jours)`);
    
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
      SELECT id FROM "User" WHERE id = ${id}
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
    
    // Statistiques des tâches (dans la plage de dates pour les tâches créées)
    const tasksTotal = await prisma.task.count({
      where: {
        userId: id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    const tasksCompleted = await prisma.task.count({
      where: {
        userId: id,
        completed: true,
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    const tasksOverdue = await prisma.task.count({
      where: {
        userId: id,
        completed: false,
        dueDate: {
          lt: new Date(),
          gte: startDate
        }
      }
    });
    
    const tasksCompletionRate = tasksTotal > 0 
      ? Math.round((tasksCompleted / tasksTotal) * 100) 
      : 0;
    
    // Statistiques des projets
    const projectsTotal = await prisma.project.count({
      where: {
        userId: id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Nombre de projets complétés
    const projectsWithTasks = await prisma.project.findMany({
      where: {
        userId: id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
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
        userId: id
      }
    });
    
    // Habitudes complétées aujourd'hui
    const habitsCompletedToday = await prisma.habitEntry.count({
      where: {
        habit: {
          userId: id
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
        userId: id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
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

    // ANALYSE DE CORRÉLATION avec plage de dates
    console.log("Début de l'analyse de corrélation habits-notes avec plage de dates");
    
    // Récupérer toutes les notes de journée de l'utilisateur dans la plage
    const dailyRatings = await prisma.habitEntry.findMany({
      where: {
        habit: {
          userId: id
        },
        rating: {
          not: null,
          gte: 0,
          lte: 10
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        habit: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    console.log("Nombre d'entrées avec notes trouvées:", dailyRatings.length);

    // Récupérer toutes les habitudes de l'utilisateur
    const userHabits = await prisma.habit.findMany({
      where: {
        userId: id
      },
      include: {
        entries: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            date: true,
            completed: true
          }
        }
      }
    });

    // Calculer les corrélations pour chaque habitude
    const habitCorrelations: HabitCorrelation[] = [];
    const ratingsByDate = new Map();
    
    // Créer un map des notes par date
    dailyRatings.forEach((rating: any) => {
      const dateKey = new Date(rating.date).toDateString();
      ratingsByDate.set(dateKey, rating.rating);
    });

    console.log("Dates avec notes:", ratingsByDate.size);

    // Pour chaque habitude, calculer la corrélation avec les notes
    for (const habit of userHabits) {
      if (habit.name.toLowerCase().includes("note de sa journée")) {
        continue;
      }

      const completionDays: number[] = [];
      const nonCompletionDays: number[] = [];

      // Pour chaque jour où il y a une note, vérifier si l'habitude était complétée
      ratingsByDate.forEach((rating, dateKey) => {
        const date = new Date(dateKey);
        const habitEntry = habit.entries.find(entry => {
          const entryDate = new Date(entry.date);
          return entryDate.toDateString() === dateKey;
        });

        if (habitEntry && habitEntry.completed) {
          completionDays.push(rating);
        } else {
          nonCompletionDays.push(rating);
        }
      });

      // Calculer les métriques si on a assez de données
      if (completionDays.length > 0 || nonCompletionDays.length > 0) {
        const avgRatingWhenCompleted = completionDays.length > 0 
          ? completionDays.reduce((sum, rating) => sum + rating, 0) / completionDays.length 
          : 0;
        
        const avgRatingWhenNotCompleted = nonCompletionDays.length > 0
          ? nonCompletionDays.reduce((sum, rating) => sum + rating, 0) / nonCompletionDays.length
          : 0;

        const impactScore = avgRatingWhenCompleted - avgRatingWhenNotCompleted;
        const totalDays = completionDays.length + nonCompletionDays.length;
        const correlation = totalDays > 5 ? impactScore / 10 : 0;
        
        // Calculer la régularité (% de jours où l'habitude était complétée)
        const regularity = totalDays > 0 ? (completionDays.length / totalDays) * 100 : 0;

        habitCorrelations.push({
          habitId: habit.id,
          habitName: habit.name,
          correlation: Math.round(correlation * 100) / 100,
          completionDays: completionDays.length,
          nonCompletionDays: nonCompletionDays.length,
          avgRatingWhenCompleted: Math.round(avgRatingWhenCompleted * 100) / 100,
          avgRatingWhenNotCompleted: Math.round(avgRatingWhenNotCompleted * 100) / 100,
          impactScore: Math.round(impactScore * 100) / 100,
          regularity: Math.round(regularity)
        });
      }
    }

    // Trier par impact décroissant
    habitCorrelations.sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore));

    // Générer les insights automatiques
    const autoInsights = generateAutoInsights(habitCorrelations, ratingsByDate.size);

    console.log("Corrélations calculées:", habitCorrelations.length);

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
      objectivesProgress,
      habitCorrelations,
      totalDaysWithRatings: ratingsByDate.size,
      autoInsights,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: totalDaysInRange
      }
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
          objectivesProgress: 0,
          habitCorrelations: [],
          totalDaysWithRatings: 0,
          autoInsights: {
            patterns: [],
            alarms: [],
            recommendations: { maintain: [], adjust: [], opportunities: [] }
          },
          dateRange: {
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            days: 0
          }
        }
      },
      { status: 500 }
    );
  }
} 