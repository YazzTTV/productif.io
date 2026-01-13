import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays, format } from 'date-fns';
import { getPlanInfo, buildLockedFeature } from '@/lib/plans';

// GET : récupérer les données mood/stress/focus sur 7 jours
export async function GET(req: NextRequest) {
  try {
    console.log('📊 [Analytics] Requête reçue');
    const authHeader = req.headers.get('authorization');
    console.log('🔑 [Analytics] Header Authorization présent:', !!authHeader);
    
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      console.error('❌ [Analytics] Utilisateur non authentifié');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    console.log('✅ [Analytics] Utilisateur authentifié:', user.id);

    const planInfo = getPlanInfo(user);
    const limits = planInfo.limits;

    const { searchParams } = new URL(req.url);
    const defaultDays = limits.analyticsRetentionDays ?? 30;
    const requestedDays = parseInt(searchParams.get('days') || String(defaultDays));
    const allowedDays = limits.analyticsRetentionDays ?? requestedDays;

    if (limits.analyticsRetentionDays !== null && requestedDays > limits.analyticsRetentionDays) {
      return NextResponse.json(
        {
          error: `Analytics détaillés réservés au plan Premium (max ${limits.analyticsRetentionDays} jours en freemium)`,
          ...buildLockedFeature('analytics'),
          plan: planInfo.plan,
          planLimits: limits,
          usage: {
            requestedDays,
            allowedDays: limits.analyticsRetentionDays,
          },
        },
        { status: 403 }
      );
    }

    const days = Math.max(1, allowedDays);

    // Récupérer les données des derniers jours autorisés
    // Utiliser UTC pour être cohérent avec les timestamps de la base de données
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - (days - 1));
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);
    sevenDaysAgo.setUTCMilliseconds(0);
    
    const todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);

    console.log(`📅 [Analytics] Date actuelle: ${now.toISOString()}`);
    console.log(`📅 [Analytics] Période: ${sevenDaysAgo.toISOString()} à ${todayEnd.toISOString()} (plan: ${planInfo.plan})`);

    // D'abord, récupérer TOUS les check-ins de l'utilisateur pour debug
    const allCheckIns = await prisma.behaviorCheckIn.findMany({
      where: {
        userId: user.id,
        type: {
          in: ['mood', 'stress', 'focus']
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });
    
    console.log(`📊 [Analytics] Total check-ins (10 derniers): ${allCheckIns.length}`);
    if (allCheckIns.length > 0) {
      console.log(`📊 [Analytics] Derniers check-ins:`, allCheckIns.map(c => ({
        id: c.id,
        type: c.type,
        value: c.value,
        timestamp: c.timestamp.toISOString(),
        date: format(c.timestamp, 'yyyy-MM-dd HH:mm')
      })));
    }

    // Maintenant, récupérer ceux de la période
    const checkIns = await prisma.behaviorCheckIn.findMany({
      where: {
        userId: user.id,
        type: {
          in: ['mood', 'stress', 'focus']
        },
        timestamp: {
          gte: sevenDaysAgo,
          lte: todayEnd
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });
    
    console.log(`📊 [Analytics] ${checkIns.length} check-ins trouvés dans la période pour l'utilisateur ${user.id}`);
    if (checkIns.length > 0) {
      console.log(`📊 [Analytics] Détails des check-ins dans la période:`, checkIns.map(c => ({
        type: c.type,
        value: c.value,
        timestamp: c.timestamp.toISOString(),
        date: format(c.timestamp, 'yyyy-MM-dd HH:mm')
      })));
    } else {
      console.warn(`⚠️ [Analytics] Aucun check-in trouvé dans la période, mais ${allCheckIns.length} check-ins existent au total`);
    }

    // Organiser les données par jour et par type
    const dataByDay: Record<string, { mood: number[]; stress: number[]; focus: number[] }> = {};
    
    // Initialiser les derniers jours (en UTC)
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setUTCDate(date.getUTCDate() - i);
      // Utiliser UTC pour le formatage de la date
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      dataByDay[dateKey] = { mood: [], stress: [], focus: [] };
    }

    // Remplir avec les données réelles (en UTC)
    checkIns.forEach(checkIn => {
      const checkInDate = new Date(checkIn.timestamp);
      const year = checkInDate.getUTCFullYear();
      const month = String(checkInDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(checkInDate.getUTCDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      console.log(`📅 [Analytics] Check-in ${checkIn.type} ${checkIn.value}/10 -> dateKey: ${dateKey}`);
      
      if (dataByDay[dateKey]) {
        const type = checkIn.type as 'mood' | 'stress' | 'focus';
        if (type === 'mood' || type === 'stress' || type === 'focus') {
          dataByDay[dateKey][type].push(checkIn.value);
          console.log(`✅ [Analytics] Check-in ajouté à ${dateKey}[${type}]`);
        }
      } else {
        console.warn(`⚠️ [Analytics] Date ${dateKey} non trouvée dans dataByDay`);
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

    const response = {
      data: analyticsData,
      averages,
      totalCheckIns: checkIns.length,
      plan: planInfo.plan,
      planLimits: limits,
      days,
    };

    console.log('📊 [Analytics] Réponse complète:', JSON.stringify(response, null, 2));
    console.log(`📊 [Analytics] Moyennes calculées:`, averages);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des analytics:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des données' },
      { status: 500 }
    );
  }
}
