import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { startOfDay, parseISO, addHours } from 'date-fns';

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { habitId, date, completed, note, rating, skipDayValidation = false } = await req.json();
    
    // Correction du problème de fuseau horaire
    const parsedDate = parseISO(date);
    const localDate = new Date(parsedDate);
    localDate.setHours(12, 0, 0, 0); // Définir à midi pour éviter les problèmes de changement de jour
    
    console.log('Date reçue:', date);
    console.log('Date ajustée:', localDate.toISOString());

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
      const dayName = localDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
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

    try {
      // Utiliser la méthode upsert de Prisma pour éviter les erreurs de clé dupliquée
      const entry = await prisma.habitEntry.upsert({
        where: {
          habitId_date: {
            habitId: habitId,
            date: localDate,
          },
        },
        update: {
          completed: completed,
          note: note || null,
          rating: rating === undefined ? null : Number(rating),
          updatedAt: new Date(),
        },
        create: {
          habitId: habitId,
          date: localDate,
          completed: completed,
          note: note || null,
          rating: rating === undefined ? null : Number(rating),
        },
      });

      return NextResponse.json(entry);
    } catch (dbError) {
      console.error("Erreur lors de l'upsert:", dbError);
      
      // Essayer avec une approche alternative en cas d'échec
      try {
        console.log("Tentative alternative pour sauvegarder l'entrée...");
        // 1. Vérifier si l'entrée existe déjà
        const existingEntry = await prisma.habitEntry.findUnique({
          where: {
            habitId_date: {
              habitId: habitId,
              date: localDate,
            },
          }
        });

        let entry;
        if (existingEntry) {
          // 2. Mettre à jour si elle existe
          entry = await prisma.habitEntry.update({
            where: {
              id: existingEntry.id
            },
            data: {
              completed: completed,
              note: note || null,
              rating: rating === undefined ? null : Number(rating),
              updatedAt: new Date(),
            }
          });
        } else {
          // 3. Créer une nouvelle entrée sinon
          entry = await prisma.habitEntry.create({
            data: {
              habitId: habitId,
              date: localDate,
              completed: completed,
              note: note || null,
              rating: rating === undefined ? null : Number(rating),
            }
          });
        }
        
        return NextResponse.json(entry);
      } catch (fallbackError) {
        console.error("Échec de la tentative alternative:", fallbackError);
        // Fournir plus de détails sur l'erreur pour le débogage
        const errorDetails = typeof dbError === 'object' && dbError !== null ? 
          JSON.stringify(dbError, Object.getOwnPropertyNames(dbError)) : String(dbError);
        
        return NextResponse.json(
          { error: 'Erreur lors de l\'opération en base de données', details: errorDetails },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'habitude:', error);
    // Fournir plus de détails sur l'erreur pour le débogage
    const errorDetails = typeof error === 'object' && error !== null ? 
      JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error);
    
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'habitude', details: errorDetails },
      { status: 500 }
    );
  }
} 