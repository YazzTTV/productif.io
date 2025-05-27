import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { parseISO } from 'date-fns';
import { GamificationService } from '@/services/gamification';

// Normaliser une date comme le frontend (midi UTC)
function normalizeDate(date: Date): Date {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  normalized.setHours(12, 0, 0, 0); // Même logique que le frontend
  return normalized;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { habitId, date, completed, note, rating, skipDayValidation = false } = await req.json();
    
    // Normaliser la date comme le frontend (midi UTC)
    const parsedDate = parseISO(date);
    const normalizedDate = normalizeDate(parsedDate);
    
    console.log('Date reçue:', date);
    console.log('Date normalisée (midi UTC):', normalizedDate.toISOString());

    // Vérifier que l'habitude appartient à l'utilisateur
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id,
      },
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habitude non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si le jour est dans les jours sélectionnés (sauf si skipDayValidation est true)
    if (!skipDayValidation) {
      const dayName = normalizedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (!habit.daysOfWeek.includes(dayName)) {
        console.warn(`Jour ${dayName} non sélectionné pour l'habitude ${habit.name} (${habitId})`);
        console.warn('Jours configurés:', habit.daysOfWeek);
        // On continue quand même, mais on enregistre cette information
      }
    }

    // Valider la note si fournie
    if (rating !== undefined && (isNaN(Number(rating)) || Number(rating) < 0 || Number(rating) > 10)) {
      return NextResponse.json(
        { error: 'La note doit être un nombre entre 0 et 10' },
        { status: 400 }
      );
    }

    // Vérifier s'il existe déjà une entrée pour cette habitude à cette date
    const existingEntry = await prisma.habitEntry.findUnique({
      where: {
        habitId_date: {
          habitId,
          date: normalizedDate,
        },
      },
    });

    let entry;
    if (existingEntry) {
      // Mettre à jour l'entrée existante
      entry = await prisma.habitEntry.update({
        where: {
          id: existingEntry.id,
        },
        data: {
          completed,
          note: note || null,
          rating: rating ? Number(rating) : null,
        },
      });
    } else {
      // Créer une nouvelle entrée
      entry = await prisma.habitEntry.create({
        data: {
          habitId,
          date: normalizedDate,
          completed,
          note: note || null,
          rating: rating ? Number(rating) : null,
        },
      });
    }

    // Traitement de la gamification si l'habitude est complétée
    let gamificationResult = null;
    if (completed) {
      try {
        const gamificationService = new GamificationService();
        gamificationResult = await gamificationService.processHabitCompletion(
          user.id,
          habitId,
          normalizedDate
        );
        console.log('Gamification traitée:', gamificationResult);
      } catch (error) {
        console.error('Erreur lors du traitement de la gamification:', error);
        // On continue même si la gamification échoue
      }
    }

    return NextResponse.json({
      entry,
      gamification: gamificationResult
    });
  } catch (error) {
    console.error('Erreur lors de la création/mise à jour de l\'entrée d\'habitude:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 