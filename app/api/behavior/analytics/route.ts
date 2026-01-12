import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays, format } from 'date-fns';

// GET : récupérer les données mood/stress/focus sur 7 jours
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les données des 7 derniers jours
    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
    const today = startOfDay(new Date());

    const checkIns = await prisma.behaviorCheckIn.findMany({
      where: {
        userId: user.id,
        type: {
          in: ['mood', 'stress', 'focus']
        },
        timestamp: {
          gte: sevenDaysAgo,
          lte: today
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Organiser les données par jour et par type
    const dataByDay: Record<string, { mood: number[]; stress: number[]; focus: number[] }> = {};
    
    // Initialiser les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      dataByDay[dateKey] = { mood: [], stress: [], focus: [] };
    }

    // Remplir avec les données réelles
    checkIns.forEach(checkIn => {
      const dateKey = format(checkIn.timestamp, 'yyyy-MM-dd');
      if (dataByDay[dateKey]) {
        const type = checkIn.type as 'mood' | 'stress' | 'focus';
        if (type === 'mood' || type === 'stress' || type === 'focus') {
          dataByDay[dateKey][type].push(checkIn.value);
        }
      }
    });

    // Calculer les moyennes par jour
    const analyticsData = Object.entries(dataByDay).map(([date, values]) => {
      const avgMood = values.mood.length > 0 
        ? values.mood.reduce((a, b) => a + b, 0) / values.mood.length 
        : null;
      const avgStress = values.stress.length > 0 
        ? values.stress.reduce((a, b) => a + b, 0) / values.stress.length 
        : null;
      const avgFocus = values.focus.length > 0 
        ? values.focus.reduce((a, b) => a + b, 0) / values.focus.length 
        : null;

      return {
        date,
        mood: avgMood ? Math.round(avgMood * 10) / 10 : null,
        stress: avgStress ? Math.round(avgStress * 10) / 10 : null,
        focus: avgFocus ? Math.round(avgFocus * 10) / 10 : null,
        moodCount: values.mood.length,
        stressCount: values.stress.length,
        focusCount: values.focus.length,
      };
    });

    // Calculer les moyennes globales sur 7 jours
    const allMoodValues = checkIns.filter(c => c.type === 'mood').map(c => c.value);
    const allStressValues = checkIns.filter(c => c.type === 'stress').map(c => c.value);
    const allFocusValues = checkIns.filter(c => c.type === 'focus').map(c => c.value);

    const averages = {
      mood: allMoodValues.length > 0 
        ? Math.round((allMoodValues.reduce((a, b) => a + b, 0) / allMoodValues.length) * 10) / 10 
        : null,
      stress: allStressValues.length > 0 
        ? Math.round((allStressValues.reduce((a, b) => a + b, 0) / allStressValues.length) * 10) / 10 
        : null,
      focus: allFocusValues.length > 0 
        ? Math.round((allFocusValues.reduce((a, b) => a + b, 0) / allFocusValues.length) * 10) / 10 
        : null,
    };

    return NextResponse.json({
      data: analyticsData,
      averages,
      totalCheckIns: checkIns.length
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des analytics:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des données' },
      { status: 500 }
    );
  }
}
