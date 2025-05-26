import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuth } from '@/middleware/api-auth';
import { parseISO, startOfDay } from 'date-fns';

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
    // Récupérer la date depuis les paramètres de requête
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Le paramètre "date" est requis (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Parser et normaliser la date
    let targetDate;
    try {
      targetDate = parseISO(dateParam);
      // Normaliser à midi pour éviter les problèmes de fuseau horaire
      targetDate.setHours(12, 0, 0, 0);
    } catch (error) {
      return NextResponse.json(
        { error: 'Format de date invalide. Utilisez le format YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Obtenir le jour de la semaine pour la date cible
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    console.log('Date cible:', targetDate.toISOString());
    console.log('Jour de la semaine:', dayOfWeek);

    // Récupérer toutes les habitudes de l'utilisateur pour ce jour
    const habits = await prisma.habit.findMany({
      where: {
        userId: userId,
        // Filtrer uniquement les habitudes pour ce jour de la semaine
        daysOfWeek: {
          has: dayOfWeek
        }
      },
      include: {
        entries: {
          where: {
            // Filtrer les entrées pour la date spécifique
            date: targetDate
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    // Transformer les résultats pour les rendre plus faciles à utiliser
    const result = habits.map(habit => {
      const entry = habit.entries.length > 0 ? habit.entries[0] : null;
      
      return {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        color: habit.color,
        frequency: habit.frequency,
        daysOfWeek: habit.daysOfWeek,
        // Informations sur l'entrée pour la date spécifique
        entry: entry ? {
          id: entry.id,
          date: entry.date,
          completed: entry.completed,
          note: entry.note,
          rating: entry.rating,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        } : null
      };
    });

    return NextResponse.json({
      date: targetDate.toISOString(),
      dayOfWeek,
      habits: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des habitudes par date:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['habits:write']
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
    // Récupérer les données de la requête
    const body = await req.json();
    const { date, habits } = body;

    // Validation
    if (!date) {
      return NextResponse.json(
        { error: 'La date est requise (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (!habits || !Array.isArray(habits) || habits.length === 0) {
      return NextResponse.json(
        { error: 'La liste des habitudes est requise' },
        { status: 400 }
      );
    }

    // Parser et normaliser la date
    let targetDate;
    try {
      targetDate = parseISO(date);
      // Normaliser à midi pour éviter les problèmes de fuseau horaire
      targetDate.setHours(12, 0, 0, 0);
    } catch (error) {
      return NextResponse.json(
        { error: 'Format de date invalide. Utilisez le format YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Vérifier que toutes les habitudes appartiennent à l'utilisateur
    const habitIds = habits.map(h => h.id);
    const userHabits = await prisma.habit.findMany({
      where: {
        id: { in: habitIds },
        userId: userId
      }
    });

    if (userHabits.length !== habitIds.length) {
      return NextResponse.json(
        { error: 'Certaines habitudes n\'appartiennent pas à l\'utilisateur' },
        { status: 403 }
      );
    }

    // Créer ou mettre à jour les entrées d'habitudes
    const results = [];
    const operations = [];

    for (const habitData of habits) {
      const { id: habitId, completed, note, rating } = habitData;

      // Valider la note si fournie
      if (rating !== undefined && (isNaN(Number(rating)) || Number(rating) < 0 || Number(rating) > 10)) {
        return NextResponse.json(
          { error: `La note pour l'habitude ${habitId} doit être un nombre entre 0 et 10` },
          { status: 400 }
        );
      }

      // Créer l'opération upsert
      operations.push(
        prisma.habitEntry.upsert({
          where: {
            habitId_date: {
              habitId,
              date: targetDate
            }
          },
          update: {
            completed: completed !== undefined ? completed : false,
            note: note || null,
            rating: rating === undefined ? null : Number(rating),
            updatedAt: new Date()
          },
          create: {
            habitId,
            date: targetDate,
            completed: completed !== undefined ? completed : false,
            note: note || null,
            rating: rating === undefined ? null : Number(rating)
          }
        })
      );
    }

    // Exécuter toutes les opérations dans une transaction
    const result = await prisma.$transaction(operations);

    // Récupérer les entrées mises à jour avec les informations des habitudes
    const updatedEntries = await prisma.habitEntry.findMany({
      where: {
        habitId: { in: habitIds },
        date: targetDate
      },
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    return NextResponse.json({
      date: targetDate.toISOString(),
      entries: updatedEntries.map(entry => ({
        id: entry.id,
        habitId: entry.habitId,
        habitName: entry.habit.name,
        habitColor: entry.habit.color,
        completed: entry.completed,
        note: entry.note,
        rating: entry.rating,
        date: entry.date
      }))
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des habitudes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 