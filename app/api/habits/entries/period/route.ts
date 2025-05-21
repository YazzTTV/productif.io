import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { parseISO, addDays } from 'date-fns';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const habitIdParam = searchParams.get('habitId'); // Optionnel, pour filtrer par habitude spécifique

    // Validation des paramètres obligatoires
    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'Les paramètres "startDate" et "endDate" sont requis (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Parser et normaliser les dates
    let startDate, endDate;
    try {
      startDate = parseISO(startDateParam);
      startDate.setHours(0, 0, 0, 0);

      endDate = parseISO(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } catch (error) {
      return NextResponse.json(
        { error: 'Format de date invalide. Utilisez le format YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    console.log('Période de recherche:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      habitId: habitIdParam || 'tous'
    });

    // Préparer les filtres de recherche
    const whereClause: Prisma.HabitEntryWhereInput = {
      date: {
        gte: startDate,
        lte: endDate
      },
      habit: {
        userId: user.id
      }
    };

    // Ajouter le filtre par habitude si spécifié
    if (habitIdParam) {
      whereClause.habitId = habitIdParam;
    }

    // Récupérer les entrées d'habitudes pour la période
    const entries = await prisma.habitEntry.findMany({
      where: whereClause,
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            color: true,
            frequency: true,
            daysOfWeek: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Organiser les résultats par date pour faciliter l'utilisation
    const entriesByDate: Record<string, any[]> = {};
    
    entries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0]; // Format YYYY-MM-DD
      
      if (!entriesByDate[dateKey]) {
        entriesByDate[dateKey] = [];
      }
      
      entriesByDate[dateKey].push({
        id: entry.id,
        habitId: entry.habitId,
        habitName: entry.habit.name,
        habitColor: entry.habit.color,
        completed: entry.completed,
        date: entry.date,
        note: entry.note,
        rating: entry.rating
      });
    });

    return NextResponse.json({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      entriesByDate: entriesByDate,
      totalEntries: entries.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des entrées d\'habitudes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 