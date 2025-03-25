import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

interface HabitCompletion {
  id: string;
  date: string;
  createdAt: string;
}

interface Habit {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  createdAt: string;
  updatedAt: string;
  completions?: HabitCompletion[];
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Récupération des habitudes pour l'utilisateur:", params.id);
    
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

    // Vérifier si la table habits existe
    try {
      const habitTableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'habits'
        );
      `;
      console.log("Table habits existe:", habitTableExists);
    } catch (error) {
      console.error("Erreur lors de la vérification de la table habits:", error);
    }

    // Récupérer les habitudes de l'utilisateur
    console.log("Tentative de récupération des habitudes");
    let habits: Habit[] = [];
    
    try {
      const rawHabits = await prisma.$queryRaw`
        SELECT 
          h.id,
          h.name,
          h.description,
          h.frequency,
          h."createdAt",
          h."updatedAt"
        FROM 
          habits h
        WHERE 
          h."userId" = ${params.id}
        ORDER BY 
          h."createdAt" DESC
      `;
      
      console.log("Habitudes récupérées:", rawHabits);
      
      // Transformer les habitudes pour avoir le bon format (name -> title)
      habits = Array.isArray(rawHabits) ? rawHabits.map(h => ({
        id: h.id,
        title: h.name,
        description: h.description,
        frequency: h.frequency,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt
      })) : [];
      
      console.log("Habitudes transformées:", habits.length);
    } catch (error) {
      console.error("Erreur SQL lors de la récupération des habitudes:", error);
      return NextResponse.json(
        { habits: [] },
        { status: 200 }
      );
    }

    // Récupérer les complétions des habitudes
    if (Array.isArray(habits) && habits.length > 0) {
      try {
        for (const habit of habits) {
          console.log("Récupération des complétions pour l'habitude:", habit.id);
          
          // Vérifier si la table habit_entries existe
          try {
            const entriesTableExists = await prisma.$queryRaw`
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'habit_entries'
              );
            `;
            console.log("Table habit_entries existe:", entriesTableExists);
          } catch (error) {
            console.error("Erreur lors de la vérification de la table habit_entries:", error);
          }
          
          const entries = await prisma.$queryRaw<HabitCompletion[]>`
            SELECT 
              id,
              date,
              "createdAt"
            FROM 
              habit_entries
            WHERE 
              "habitId" = ${habit.id}
              AND completed = true
            ORDER BY 
              date DESC
          `;
          
          console.log(`Entrées récupérées pour l'habitude ${habit.id}:`, Array.isArray(entries) ? entries.length : 0);
          habit.completions = Array.isArray(entries) ? entries : [];
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des complétions:", error);
      }
    }

    return NextResponse.json({ habits }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des habitudes:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des habitudes", habits: [] },
      { status: 500 }
    );
  }
} 