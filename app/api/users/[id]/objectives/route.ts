import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

interface Objective {
  id: string;
  title: string;
  current: number;
  progress: number;
  target: number;
  quarter: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  actions?: ObjectiveAction[];
}

interface ObjectiveAction {
  id: string;
  title: string;
  current: number;
  progress: number;
  target: number;
  createdAt: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Récupération des objectifs pour l'utilisateur:", params.id);
    
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

    // Vérifier les tables disponibles pour les missions/objectifs
    try {
      const objectivesTables = await prisma.$queryRaw`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name IN ('missions', 'objectives', 'objective_actions')
      `;
      console.log("Tables des objectifs disponibles:", objectivesTables);
    } catch (error) {
      console.error("Erreur lors de la vérification des tables d'objectifs:", error);
    }

    // Récupérer les missions (qui contiennent les objectifs)
    const missions = await prisma.mission.findMany({
      where: {
        userId: params.id
      },
      include: {
        objectives: {
          include: {
            actions: true
          }
        }
      },
      orderBy: {
        year: 'desc'
      }
    });

    console.log("Missions récupérées:", missions.length);

    // Formater les données pour la réponse
    const objectives = missions.flatMap(mission => 
      mission.objectives.map(objective => ({
        id: objective.id,
        title: objective.title,
        current: objective.current,
        progress: objective.progress,
        target: objective.target,
        quarter: mission.quarter,
        year: mission.year,
        createdAt: objective.createdAt.toISOString(),
        updatedAt: objective.updatedAt.toISOString(),
        actions: objective.actions.map(action => ({
          id: action.id,
          title: action.title,
          current: action.current,
          progress: action.progress,
          target: action.target,
          createdAt: action.createdAt.toISOString()
        }))
      }))
    );

    console.log("Objectifs formatés:", objectives.length);

    return NextResponse.json({ objectives }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des objectifs:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des objectifs", objectives: [] },
      { status: 500 }
    );
  }
} 