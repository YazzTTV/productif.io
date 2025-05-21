import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  order: number;
  priority: number | null;
  energyLevel: number | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification de l'utilisateur actuel
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour accéder à cette ressource" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est un SUPER_ADMIN
    const isSuperAdmin = await prisma.$queryRaw`
      SELECT role FROM "User" WHERE id = ${authUser.id} AND role = 'SUPER_ADMIN'
    `;

    if (!Array.isArray(isSuperAdmin) || isSuperAdmin.length === 0) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour accéder à cette ressource" },
        { status: 403 }
      );
    }

    // Récupérer l'utilisateur cible
    const targetUser = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE id = ${params.id}
    `;

    if (!Array.isArray(targetUser) || targetUser.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les tâches de l'utilisateur
    const tasks = await prisma.$queryRaw<Task[]>`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.completed,
        t."order",
        t.priority,
        t."energyLevel",
        t."dueDate",
        t."createdAt",
        t."updatedAt",
        p.id AS "projectId",
        p.name AS "projectName",
        p.color AS "projectColor"
      FROM 
        "Task" t
      LEFT JOIN
        "Project" p ON t."projectId" = p.id
      WHERE 
        t."userId" = ${params.id}
      ORDER BY 
        t.completed ASC,
        t."order" ASC
    `;

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des tâches" },
      { status: 500 }
    );
  }
} 