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

    // Récupérer toutes les entreprises
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        users: {
          include: {
            user: true
          }
        }
      }
    });

    // Date pour le calcul des utilisateurs actifs (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Pour chaque entreprise, calculer ses statistiques
    const companiesStats = await Promise.all(
      companies.map(async (company) => {
        // Nombre total d'utilisateurs dans l'entreprise
        const userCount = company.users.length;
        
        // IDs des utilisateurs de l'entreprise
        const userIds = company.users.map(uc => uc.userId);
        
        // Utilisateurs actifs (qui ont eu une activité dans les 30 derniers jours)
        let activeUserCount = 0;
        
        if (userIds.length > 0) {
          // Remplacer la requête SQL raw par des requêtes Prisma standard
          const activeTasks = await prisma.task.findMany({
            where: {
              userId: {
                in: userIds
              },
              updatedAt: {
                gte: thirtyDaysAgo
              }
            },
            distinct: ['userId'],
            select: {
              userId: true
            }
          });
          
          const activeHabits = await prisma.habit.findMany({
            where: {
              userId: {
                in: userIds
              },
              updatedAt: {
                gte: thirtyDaysAgo
              }
            },
            distinct: ['userId'],
            select: {
              userId: true
            }
          });
          
          const activeMissions = await prisma.mission.findMany({
            where: {
              userId: {
                in: userIds
              },
              updatedAt: {
                gte: thirtyDaysAgo
              }
            },
            distinct: ['userId'],
            select: {
              userId: true
            }
          });
          
          // Combiner les utilisateurs actifs uniques
          const activeUserIdsSet = new Set([
            ...activeTasks.map(task => task.userId),
            ...activeHabits.map(habit => habit.userId),
            ...activeMissions.map(mission => mission.userId)
          ]);
          
          activeUserCount = activeUserIdsSet.size;
        }
        
        // Taux de complétion des tâches
        let tasksCompletion = 0;
        
        if (userIds.length > 0) {
          const totalTasks = await prisma.task.count({
            where: {
              userId: {
                in: userIds
              }
            }
          });
          
          const completedTasks = await prisma.task.count({
            where: {
              userId: {
                in: userIds
              },
              completed: true
            }
          });
          
          tasksCompletion = totalTasks > 0 
            ? Math.round((completedTasks / totalTasks) * 100) 
            : 0;
        }
        
        // Taux d'adoption des habitudes
        let habitsAdoption = 0;
        
        if (userIds.length > 0) {
          const totalHabits = await prisma.habit.count({
            where: {
              userId: {
                in: userIds
              }
            }
          });
          
          // Nombre d'habitudes complétées au moins une fois dans les 7 derniers jours
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const habitsWithEntries = await prisma.habitEntry.findMany({
            where: {
              habit: {
                userId: {
                  in: userIds
                }
              },
              date: {
                gte: sevenDaysAgo
              },
              completed: true
            },
            distinct: ['habitId']
          });
          
          const activeHabits = habitsWithEntries.length;
          
          habitsAdoption = totalHabits > 0 
            ? Math.round((activeHabits / totalHabits) * 100) 
            : 0;
        }
        
        // Progrès des objectifs
        let objectivesProgress = 0;
        
        if (userIds.length > 0) {
          const objectives = await prisma.objective.findMany({
            where: {
              mission: {
                userId: {
                  in: userIds
                }
              }
            },
            select: {
              progress: true
            }
          });
          
          if (objectives.length > 0) {
            const totalProgress = objectives.reduce((sum, obj) => sum + obj.progress, 0);
            objectivesProgress = Math.round(totalProgress / objectives.length);
          }
        }
        
        return {
          id: company.id,
          name: company.name,
          userCount,
          activeUserCount,
          tasksCompletion,
          habitsAdoption,
          objectivesProgress
        };
      })
    );
    
    // Trier par nombre d'utilisateurs (décroissant)
    const sortedCompanies = companiesStats.sort((a, b) => b.userCount - a.userCount);
    
    return NextResponse.json({ companies: sortedCompanies });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques des entreprises:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques des entreprises" },
      { status: 500 }
    );
  }
} 