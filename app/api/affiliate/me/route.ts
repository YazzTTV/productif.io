import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ONELINK_BASE_URL = 'https://productif.onelink.me/HCEk';
const PREMIUM_STATUSES = new Set(['active', 'trialing', 'paid']);

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const affiliateId = user.id;
    const referralLink = `${ONELINK_BASE_URL}?af_sub1=${affiliateId}&pid=ambassador`;

    const [
      referredUsersCount,
      referredUsers,
      commissionAggregates,
      revenueTotal,
      revenue30d,
    ] = await Promise.all([
      prisma.user.count({
        where: { referredBy: affiliateId },
      }),

      prisma.user.findMany({
        where: { referredBy: affiliateId },
        select: { id: true, subscriptionStatus: true },
      }),

      prisma.commissionLedger.groupBy({
        by: ['status'],
        where: { affiliateId },
        _sum: { commissionAmount: true },
      }),

      prisma.subscriptionEvent.aggregate({
        where: {
          user: { referredBy: affiliateId },
          price: { gt: 0 },
          eventName: { in: ['initial_purchase', 'renewal', 'non_renewing_purchase'] },
        },
        _sum: { price: true },
      }),

      prisma.subscriptionEvent.aggregate({
        where: {
          user: { referredBy: affiliateId },
          price: { gt: 0 },
          eventName: { in: ['initial_purchase', 'renewal', 'non_renewing_purchase'] },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { price: true },
      }),
    ]);

    const paidUsersCount = referredUsers.filter(
      (u) => u.subscriptionStatus && PREMIUM_STATUSES.has(u.subscriptionStatus),
    ).length;

    const commissionsByStatus: Record<string, number> = {};
    for (const row of commissionAggregates) {
      commissionsByStatus[row.status] = row._sum.commissionAmount || 0;
    }

    return NextResponse.json({
      affiliateId,
      referralLink,
      referredUsersCount,
      paidUsersCount,
      revenueTotal: Math.round((revenueTotal._sum.price || 0) * 100) / 100,
      revenue30d: Math.round((revenue30d._sum.price || 0) * 100) / 100,
      commissionsPending: Math.round((commissionsByStatus.pending || 0) * 100) / 100,
      commissionsEligible: Math.round((commissionsByStatus.eligible || 0) * 100) / 100,
      commissionsPaid: Math.round((commissionsByStatus.paid || 0) * 100) / 100,
    });
  } catch (error) {
    console.error('[Affiliate] Erreur /me:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
