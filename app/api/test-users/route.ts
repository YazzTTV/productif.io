import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("GET /api/test-users - Récupération de tous les utilisateurs");

    // Utiliser une requête SQL directe pour obtenir tous les utilisateurs
    const users = await prisma.$queryRaw`
      SELECT id, name, email, role, "createdAt", "updatedAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `;

    console.log("Nombre d'utilisateurs trouvés:", Array.isArray(users) ? users.length : 0);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return NextResponse.json({ 
      error: "Erreur serveur", 
      message: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
} 