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

    const { habitId, date, completed, note, rating } = await req.json();
    
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

    // Vérifier si le jour est dans les jours sélectionnés
    const dayName = localDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (!habit.daysOfWeek.includes(dayName)) {
      return NextResponse.json(
        { error: 'Ce jour n\'est pas sélectionné pour cette habitude' },
        { status: 400 }
      );
    }

    // Valider la note si fournie
    if (rating !== undefined && (isNaN(Number(rating)) || Number(rating) < 0 || Number(rating) > 10)) {
      return NextResponse.json(
        { error: 'La note doit être un nombre entre 0 et 10' },
        { status: 400 }
      );
    }

    // Solution simplifiée : Supprimer les entrées existantes pour cette date et habitude, puis créer une nouvelle
    // Cela évite les problèmes de schéma avec les champs note et rating
    try {
      // 1. Vérifier si l'entrée existe déjà
      const existingEntry = await prisma.$queryRaw`
        SELECT id FROM "habit_entries" 
        WHERE "habitId" = ${habitId} AND date = ${localDate}::date
      `;

      // 2. Si elle existe, la supprimer
      if (existingEntry && Array.isArray(existingEntry) && existingEntry.length > 0) {
        await prisma.$executeRaw`
          DELETE FROM "habit_entries" 
          WHERE "habitId" = ${habitId} AND date = ${localDate}::date
        `;
      }

      // 3. Créer une nouvelle entrée avec tous les champs
      await prisma.$executeRaw`
        INSERT INTO "habit_entries" (
          id, "habitId", date, completed, note, rating, "createdAt", "updatedAt"
        ) VALUES (
          ${crypto.randomUUID()}, 
          ${habitId}, 
          ${localDate}::date, 
          ${completed}, 
          ${note || null}, 
          ${rating === undefined ? null : Number(rating)}, 
          now(), 
          now()
        )
      `;

      // 4. Récupérer l'entrée créée pour la renvoyer
      const newEntry = await prisma.$queryRaw`
        SELECT * FROM "habit_entries" 
        WHERE "habitId" = ${habitId} AND date = ${localDate}::date
      `;

      // Prendre le premier résultat si c'est un tableau
      const entryData = Array.isArray(newEntry) ? newEntry[0] : newEntry;

      return NextResponse.json(entryData);
    } catch (dbError) {
      console.error("Erreur SQL:", dbError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'opération en base de données' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'habitude:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'habitude' },
      { status: 500 }
    );
  }
} 