import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { parseISO } from 'date-fns';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les données de la requête
    const body = await request.json();
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
        userId: user.id
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