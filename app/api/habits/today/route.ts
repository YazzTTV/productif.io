import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuth } from '@/middleware/api-auth';
import { startOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['habits:read']
  })
  
  // Si l'authentification a échoué, retourner la réponse d'erreur
  if (authResponse) {
    return authResponse
  }
  
  // Extraire l'ID de l'utilisateur à partir de l'en-tête (ajouté par le middleware)
  const userId = req.headers.get('x-api-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }

  try {
    // Obtenir la date du jour
    const today = new Date();
    // Normaliser à minuit puis mettre à midi pour éviter les problèmes de fuseau horaire
    const normalizedDate = startOfDay(today);
    normalizedDate.setHours(12, 0, 0, 0);
    
    console.log("Date aujourd'hui:", today.toISOString());
    console.log("Date normalisée:", normalizedDate.toISOString());
    
    // Obtenir le jour en anglais pour le filtrage
    const currentDayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    console.log("Jour de la semaine actuel:", currentDayOfWeek);

    // Récupérer toutes les habitudes de l'utilisateur
    const habits = await prisma.habit.findMany({
      where: {
        userId: userId,
        // Filtrer uniquement les habitudes pour ce jour de la semaine
        daysOfWeek: {
          has: currentDayOfWeek
        }
      },
      include: {
        entries: {
          where: {
            // Utiliser la date normalisée pour la cohérence
            date: normalizedDate
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    console.log(`Trouvé ${habits.length} habitudes pour ${currentDayOfWeek}`);

    // Transformez les données pour les rendre plus faciles à utiliser
    const result = habits.map(habit => {
      const entry = habit.entries.length > 0 ? habit.entries[0] : null;
      
      return {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        color: habit.color,
        completed: entry ? entry.completed : false,
        entryId: entry ? entry.id : null
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la récupération des habitudes d'aujourd'hui:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des habitudes d'aujourd'hui" },
      { status: 500 }
    );
  }
} 