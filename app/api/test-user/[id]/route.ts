import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("GET /api/test-user/[id] - ID reçu:", params.id);

    // Utiliser une requête SQL directe pour obtenir tous les champs
    const users = await prisma.$queryRaw`
      SELECT id, name, email, role, "createdAt", "updatedAt"
      FROM "User"
      WHERE id = ${params.id}
    `;

    console.log("Utilisateur trouvé:", users);

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ 
        error: "Utilisateur non trouvé" 
      }, { status: 404 });
    }

    return NextResponse.json({ user: users[0] });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur", 
      message: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
} 