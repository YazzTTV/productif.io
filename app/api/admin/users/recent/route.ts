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

    // Récupérer les 10 derniers utilisateurs inscrits
    const recentUsers = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        companies: {
          include: {
            company: true
          }
        }
      }
    });

    // Transformer les données pour obtenir le format souhaité
    const formattedUsers = recentUsers.map(user => ({
      id: user.id,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      companyName: user.companies.length > 0 ? user.companies[0].company.name : null
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs récents:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs récents" },
      { status: 500 }
    );
  }
} 