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
      targetDate.setHours(12, 0, 0, 0);
    } catch (error) {
      return NextResponse.json(
        { error: 'Format de date invalide. Utilisez le format YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Récupérer les entrées pour cette date
    const entries = await prisma.habitEntry.findMany({
      where: {
        date: targetDate,
        habit: {
          userId: userId,
        },
      },
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        habit: {
          order: 'asc',
        },
      },
    });

    return NextResponse.json({
      date: targetDate.toISOString(),
      entries: entries.map(entry => ({
        id: entry.id,
        habitId: entry.habitId,
        habitName: entry.habit.name,
        habitColor: entry.habit.color,
        completed: entry.completed,
        note: entry.note,
        rating: entry.rating,
        date: entry.date,
      })),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des entrées par date:', error);
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
    const { habitId, date, completed, note, rating } = body;

    // Validation
    if (!habitId) {
      return NextResponse.json(
        { error: 'L\'ID de l\'habitude est requis' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'La date est requise (format: YYYY-MM-DD)' },
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

    // Vérifier que l'habitude appartient à l'utilisateur
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: userId
      }
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habitude non trouvée ou n\'appartenant pas à l\'utilisateur' },
        { status: 404 }
      );
    }

    // Valider la note si fournie
    if (rating !== undefined && (isNaN(Number(rating)) || Number(rating) < 0 || Number(rating) > 10)) {
      return NextResponse.json(
        { error: 'La note doit être un nombre entre 0 et 10' },
        { status: 400 }
      );
    }

    // Créer ou mettre à jour l'entrée d'habitude
    const entry = await prisma.habitEntry.upsert({
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
    });

    // Récupérer l'entrée mise à jour avec les informations de l'habitude
    const updatedEntry = await prisma.habitEntry.findUnique({
      where: {
        id: entry.id
      },
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
      }
    });

    if (!updatedEntry) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de l\'entrée mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entry: {
        id: updatedEntry.id,
        habitId: updatedEntry.habitId,
        habitName: updatedEntry.habit.name,
        habitColor: updatedEntry.habit.color,
        completed: updatedEntry.completed,
        note: updatedEntry.note,
        rating: updatedEntry.rating,
        date: updatedEntry.date,
        createdAt: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'entrée d\'habitude:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 