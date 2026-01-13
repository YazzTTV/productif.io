import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { TrialService } from '@/lib/trial/TrialService';
import { getPlanInfo } from '@/lib/plans';

export async function GET(req: NextRequest) {
  try {
    // Utiliser getAuthUserFromRequest pour gérer à la fois les cookies (web) et les headers (mobile)
    const user = await getAuthUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const accessCheck = await TrialService.hasAccess(user.id);
    const planInfo = getPlanInfo(user);

    return NextResponse.json({
      status: accessCheck.status,
      daysLeft: accessCheck.trialDaysLeft,
      hasAccess: accessCheck.hasAccess,
      plan: planInfo.plan,
      planLimits: planInfo.limits,
      isPremium: planInfo.isPremium,
    });
  } catch (error) {
    console.error('Erreur récupération statut trial:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
