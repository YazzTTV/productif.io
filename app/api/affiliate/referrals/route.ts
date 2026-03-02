import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolvePlan } from '@/lib/plans';

const PAGE_SIZE = 20;

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const domainParts = domain.split('.');
  const tld = domainParts.slice(1).join('.');
  return `${local.charAt(0)}***@${domain.charAt(0)}***.${tld}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const affiliateId = user.id;
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor');

    const total = await prisma.user.count({
      where: { referredBy: affiliateId },
    });

    const referredUsers = await prisma.user.findMany({
      where: { referredBy: affiliateId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        stripeSubscriptionId: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = referredUsers.length > PAGE_SIZE;
    const items = hasMore ? referredUsers.slice(0, PAGE_SIZE) : referredUsers;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const userIds = items.map((u) => u.id);

    const [revenueByUser, commissionsByUser] = await Promise.all([
      prisma.subscriptionEvent.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          price: { gt: 0 },
          eventName: { in: ['initial_purchase', 'renewal', 'non_renewing_purchase'] },
        },
        _sum: { price: true },
      }),

      prisma.commissionLedger.groupBy({
        by: ['referredUserId', 'status'],
        where: { referredUserId: { in: userIds } },
        _sum: { commissionAmount: true },
      }),
    ]);

    const revenueMap = new Map<string, number>();
    for (const row of revenueByUser) {
      revenueMap.set(row.userId, row._sum.price || 0);
    }

    const commissionMap = new Map<string, { total: number; latestStatus: string }>();
    for (const row of commissionsByUser) {
      const existing = commissionMap.get(row.referredUserId);
      const amount = row._sum.commissionAmount || 0;
      if (!existing) {
        commissionMap.set(row.referredUserId, { total: amount, latestStatus: row.status });
      } else {
        existing.total += amount;
        if (row.status === 'eligible' || row.status === 'paid') {
          existing.latestStatus = row.status;
        }
      }
    }

    const referrals = items.map((u) => {
      const plan = resolvePlan(u);
      const commission = commissionMap.get(u.id);
      return {
        id: u.id,
        emailMasked: maskEmail(u.email),
        createdAt: u.createdAt.toISOString(),
        isPremium: plan === 'premium',
        estimatedRevenue: Math.round((revenueMap.get(u.id) || 0) * 100) / 100,
        lastActiveAt: u.updatedAt.toISOString(),
        commissionTotal: Math.round((commission?.total || 0) * 100) / 100,
        commissionStatus: commission?.latestStatus || 'none',
      };
    });

    return NextResponse.json({ referrals, nextCursor, total });
  } catch (error) {
    console.error('[Affiliate] Erreur /referrals:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
