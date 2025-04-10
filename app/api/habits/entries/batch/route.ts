import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { startOfDay } from 'date-fns';

interface BatchAction {
  habitId: string;
  date: Date | string;
  completed: boolean;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { actions } = await req.json();
    
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { error: 'Aucune action fournie' },
        { status: 400 }
      );
    }

    console.log('Actions reçues:', JSON.stringify(actions));

    // Validation des données et vérification des permissions
    const habitIds = [...new Set(actions.map(action => action.habitId))];
    
    // Vérifier que toutes les habitudes appartiennent à l'utilisateur
    const userHabits = await prisma.habit.findMany({
      where: {
        id: { in: habitIds },
        userId: user.id,
      },
      select: {
        id: true,
        daysOfWeek: true,
      }
    });

    if (userHabits.length !== habitIds.length) {
      return NextResponse.json(
        { error: 'Certaines habitudes n\'appartiennent pas à cet utilisateur' },
        { status: 403 }
      );
    }

    // Créer un map des habitudes pour faciliter l'accès
    const habitsMap = new Map(userHabits.map(habit => [habit.id, habit]));

    // Traiter chaque action
    const results = [];
    
    for (const action of actions) {
      const { habitId, date, completed } = action;
      const habit = habitsMap.get(habitId);
      
      if (!habit) continue; // Ignoré si l'habitude n'existe pas (ne devrait pas arriver à ce stade)
      
      // Normaliser la date en s'assurant qu'elle correspond au début du jour (minuit)
      // puis configurer à midi pour éviter les problèmes de fuseau horaire
      const parsedDate = new Date(date);
      const normalizedDate = startOfDay(parsedDate);
      normalizedDate.setHours(12, 0, 0, 0);
      
      console.log('Date reçue:', date);
      console.log('Date normalisée:', normalizedDate.toISOString());
      
      // Vérifier si le jour est dans les jours sélectionnés
      const dayName = normalizedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      console.log('Jour de la semaine:', dayName);
      console.log('Jours configurés:', habit.daysOfWeek);
      
      if (!habit.daysOfWeek.includes(dayName)) {
        results.push({
          habitId,
          date: normalizedDate,
          status: 'error',
          message: 'Ce jour n\'est pas sélectionné pour cette habitude'
        });
        continue;
      }
      
      try {
        // Approche upsert : mettre à jour si l'entrée existe, sinon créer une nouvelle
        const entry = await prisma.habitEntry.upsert({
          where: {
            habitId_date: {
              habitId,
              date: normalizedDate,
            }
          },
          update: {
            completed,
          },
          create: {
            habitId,
            date: normalizedDate,
            completed,
          },
        });
        
        results.push({
          habitId,
          date: normalizedDate,
          status: 'success',
          entry
        });
      } catch (error) {
        console.error(`Erreur lors du traitement de l'entrée pour ${habitId}:`, error);
        results.push({
          habitId,
          date: normalizedDate,
          status: 'error',
          message: 'Erreur lors du traitement de l\'entrée'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Erreur lors du traitement du lot d\'habitudes:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du lot d\'habitudes' },
      { status: 500 }
    );
  }
} 