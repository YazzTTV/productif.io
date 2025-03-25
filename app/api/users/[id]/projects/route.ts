import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Récupération des projets pour l'utilisateur:", params.id);
    
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

    console.log("Tentative de récupération des projets");
    
    // Utiliser Prisma Client au lieu des requêtes SQL brutes pour plus de fiabilité
    const projects = await prisma.project.findMany({
      where: {
        userId: params.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log("Projets récupérés:", projects.length);

    // Récupérer le nombre de tâches pour chaque projet
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        // Compter le nombre total de tâches pour ce projet
        const totalTasks = await prisma.task.count({
          where: {
            projectId: project.id
          }
        });
        
        // Compter le nombre de tâches complétées
        const completedTasks = await prisma.task.count({
          where: {
            projectId: project.id,
            completed: true
          }
        });
        
        // Calculer le pourcentage de progression
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Définir un statut par défaut puisque ce champ n'existe pas dans le schéma
        const status = progress === 100 ? "COMPLETED" : 
                      progress > 0 ? "IN_PROGRESS" : "NOT_STARTED";
        
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: status,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
          totalTasks,
          completedTasks,
          progress
        };
      })
    );

    console.log("Projets avec statistiques:", projectsWithStats.length);
    
    return NextResponse.json({ projects: projectsWithStats }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des projets", projects: [] },
      { status: 500 }
    );
  }
} 