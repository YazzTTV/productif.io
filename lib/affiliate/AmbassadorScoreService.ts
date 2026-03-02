import { prisma } from '@/lib/prisma';

export type AmbassadorTier = 'bronze' | 'silver' | 'gold';

export interface ScoreBreakdown {
  reach: number;
  activity: number;
  revenue: number;
  trust: number;
  total: number;
  tier: AmbassadorTier;
  nextTier: AmbassadorTier | null;
  pointsToNext: number;
}

const TIER_THRESHOLDS: Record<AmbassadorTier, number> = {
  bronze: 0,
  silver: 250,
  gold: 600,
};

const TIER_COMMISSION_RATES: Record<AmbassadorTier, number> = {
  bronze: 0.50,
  silver: 0.50,
  gold: 0.60,
};

function tierFromScore(score: number): AmbassadorTier {
  if (score >= TIER_THRESHOLDS.gold) return 'gold';
  if (score >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

function nextTier(tier: AmbassadorTier): AmbassadorTier | null {
  if (tier === 'bronze') return 'silver';
  if (tier === 'silver') return 'gold';
  return null;
}

// --- Reach Score (max 200) ---
function computeReachScore(followersBucket: string | null): number {
  if (!followersBucket) return 0;
  const map: Record<string, number> = {
    '0-1k': 20,
    '1k-10k': 60,
    '10k-50k': 120,
    '50k-100k': 160,
    '50k-200k': 160,
    '100k-500k': 200,
    '500k+': 200,
  };
  return map[followersBucket] ?? 20;
}

// --- Activity Score (max 200) ---
// Based on unique referred signups in last 30 days as proxy for content activity
function computeActivityScore(referredLast30d: number): number {
  if (referredLast30d >= 10) return 200;
  if (referredLast30d >= 6) return 170;
  if (referredLast30d >= 3) return 120;
  if (referredLast30d >= 1) return 50;
  return 0;
}

// --- Revenue Score (max 500) ---
function computeRevenueScore(revenue30d: number): number {
  if (revenue30d >= 1000) return 500;
  if (revenue30d >= 500) return 420;
  if (revenue30d >= 200) return 300;
  if (revenue30d >= 50) return 180;
  if (revenue30d >= 1) return 80;
  return 0;
}

// --- Trust Bonus (max 100, can go negative) ---
function computeTrustBonus(params: {
  verified: boolean;
  conversionRate: number;
  accountAgeDays: number;
  fraudDetected: boolean;
}): number {
  let bonus = 0;
  if (params.verified) bonus += 30;
  if (params.conversionRate > 0.05) bonus += 30;
  if (params.accountAgeDays > 30) bonus += 20;
  if (!params.fraudDetected) bonus += 20;
  if (params.fraudDetected) bonus -= 100;
  return Math.max(-100, Math.min(100, bonus));
}

export class AmbassadorScoreService {
  static async computeScore(affiliateId: string): Promise<ScoreBreakdown> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      user,
      creatorApp,
      referredLast30d,
      revenueAgg,
      referredTotal,
      paidUsersCount,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: affiliateId },
        select: {
          id: true,
          createdAt: true,
          ambassadorVerified: true,
          ambassadorScore: true,
          ambassadorTier: true,
        },
      }),

      prisma.creatorApplication.findFirst({
        where: { userId: affiliateId },
        select: { followers: true },
      }),

      prisma.user.count({
        where: {
          referredBy: affiliateId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      prisma.subscriptionEvent.aggregate({
        where: {
          user: { referredBy: affiliateId },
          price: { gt: 0 },
          eventName: { in: ['initial_purchase', 'renewal', 'non_renewing_purchase'] },
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { price: true },
      }),

      prisma.user.count({
        where: { referredBy: affiliateId },
      }),

      prisma.user.count({
        where: {
          referredBy: affiliateId,
          subscriptionStatus: { in: ['active', 'trialing', 'paid'] },
        },
      }),
    ]);

    if (!user) {
      return {
        reach: 0, activity: 0, revenue: 0, trust: 0,
        total: 0, tier: 'bronze', nextTier: 'silver', pointsToNext: 250,
      };
    }

    const followersBucket = creatorApp?.followers ?? null;
    const revenue30d = revenueAgg._sum.price ?? 0;
    const accountAgeDays = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const conversionRate = referredTotal > 0 ? paidUsersCount / referredTotal : 0;

    const reach = computeReachScore(followersBucket);
    const activity = computeActivityScore(referredLast30d);
    const revenue = computeRevenueScore(revenue30d);
    const trust = computeTrustBonus({
      verified: user.ambassadorVerified,
      conversionRate,
      accountAgeDays,
      fraudDetected: false,
    });

    const total = Math.max(0, Math.min(1000, reach + activity + revenue + trust));
    const tier = tierFromScore(total);
    const next = nextTier(tier);
    const pointsToNext = next ? Math.max(0, TIER_THRESHOLDS[next] - total) : 0;

    // Persist score + tier
    await prisma.user.update({
      where: { id: affiliateId },
      data: {
        ambassadorScore: total,
        ambassadorTier: tier,
        ambassadorScoredAt: new Date(),
      },
    });

    return { reach, activity, revenue, trust, total, tier, nextTier: next, pointsToNext };
  }

  static getCommissionRate(tier: AmbassadorTier): number {
    return TIER_COMMISSION_RATES[tier];
  }

  static getTierLabel(tier: AmbassadorTier): string {
    const labels: Record<AmbassadorTier, string> = {
      bronze: 'Explorateur',
      silver: 'Performer',
      gold: 'Élite',
    };
    return labels[tier];
  }

  static getTierThresholds() {
    return TIER_THRESHOLDS;
  }
}
