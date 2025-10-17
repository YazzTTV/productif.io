import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

// Liste de toutes les permissions disponibles
const ALL_PERMISSIONS = [
  'tasks:read',
  'tasks:write',
  'habits:read',
  'habits:write',
  'projects:read',
  'projects:write',
  'objectives:read',
  'objectives:write',
  'processes:read',
  'processes:write',
  'journal:read',
  'journal:write',
  'deepwork:read',
  'deepwork:write'
];

export async function POST(req: Request) {
  try {
    // Vérifier l'authentification
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Un nom est requis pour le token" },
        { status: 400 }
      );
    }

    // Générer un nouveau token
    const token = uuidv4().replace(/-/g, '');

    // Sauvegarder le token dans la base de données avec toutes les permissions
    const apiToken = await prisma.apiToken.create({
      data: {
        token,
        userId: user.id,
        name,
        scopes: ALL_PERMISSIONS
      }
    });

    return NextResponse.json({ token: apiToken.token });
  } catch (error) {
    console.error("Erreur lors de la création du token:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du token" },
      { status: 500 }
    );
  }
} 