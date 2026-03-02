import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { AmbassadorScoreService } from '@/lib/affiliate/AmbassadorScoreService';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const breakdown = await AmbassadorScoreService.computeScore(user.id);

    return NextResponse.json({
      score: breakdown.total,
      tier: breakdown.tier,
      tierLabel: AmbassadorScoreService.getTierLabel(breakdown.tier),
      commissionRate: AmbassadorScoreService.getCommissionRate(breakdown.tier),
      nextTier: breakdown.nextTier,
      nextTierLabel: breakdown.nextTier
        ? AmbassadorScoreService.getTierLabel(breakdown.nextTier)
        : null,
      pointsToNext: breakdown.pointsToNext,
      breakdown: {
        reach: breakdown.reach,
        activity: breakdown.activity,
        revenue: breakdown.revenue,
        trust: breakdown.trust,
      },
      thresholds: AmbassadorScoreService.getTierThresholds(),
    });
  } catch (error) {
    console.error('[Affiliate] Erreur /score:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
