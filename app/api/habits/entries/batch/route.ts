import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuth } from '@/middleware/api-auth';
import { startOfDay } from 'date-fns';

interface BatchAction {
  habitId: string;
  date: Date | string;
  completed: boolean;
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
    const { actions }: { actions: BatchAction[] } = await req.json();

    if (!actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { error: 'Actions invalides' },
        { status: 400 }
      );
    }

    // Vérifier que toutes les habitudes appartiennent à l'utilisateur
    const habitIds = [...new Set(actions.map(action => action.habitId))];
    const habits = await prisma.habit.findMany({
      where: {
        id: { in: habitIds },
        userId: userId,
      },
    });

    if (habits.length !== habitIds.length) {
      return NextResponse.json(
        { error: 'Certaines habitudes n\'appartiennent pas à l\'utilisateur' },
        { status: 403 }
      );
    }

    // Traiter chaque action
    const results = await Promise.all(
      actions.map(async (action) => {
        const entryDate = new Date(action.date);
        entryDate.setHours(12, 0, 0, 0);

        return prisma.habitEntry.upsert({
          where: {
            habitId_date: {
              habitId: action.habitId,
              date: entryDate,
            },
          },
          update: {
            completed: action.completed,
          },
          create: {
            habitId: action.habitId,
            date: entryDate,
            completed: action.completed,
          },
        });
      })
    );

    return NextResponse.json({ success: true, entries: results });
  } catch (error) {
    console.error('Erreur lors du traitement en lot des entrées d\'habitudes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 