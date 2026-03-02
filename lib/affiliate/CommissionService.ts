import { prisma } from '@/lib/prisma';

const DEFAULT_COMMISSION_RATE = 0.50;
const ELIGIBILITY_DELAY_DAYS = 14;

export class CommissionService {
  /**
   * Crée une commission pour un affilié suite à un paiement d'un user référé.
   * Vérifie que l'affilié existe et n'est pas le user lui-même.
   */
  static async createCommission(params: {
    affiliateId: string;
    referredUserId: string;
    subscriptionEventId: string;
    amountGross: number;
    currency?: string;
    commissionRate?: number;
  }): Promise<{ created: boolean; reason?: string }> {
    const {
      affiliateId,
      referredUserId,
      subscriptionEventId,
      amountGross,
      currency = 'EUR',
      commissionRate = DEFAULT_COMMISSION_RATE,
    } = params;

    if (affiliateId === referredUserId) {
      return { created: false, reason: 'self_referral' };
    }

    if (amountGross <= 0) {
      return { created: false, reason: 'zero_amount' };
    }

    const affiliateExists = await prisma.user.findUnique({
      where: { id: affiliateId },
      select: { id: true },
    });
    if (!affiliateExists) {
      return { created: false, reason: 'affiliate_not_found' };
    }

    const existing = await prisma.commissionLedger.findFirst({
      where: { subscriptionEventId },
    });
    if (existing) {
      return { created: false, reason: 'duplicate_event' };
    }

    const commissionAmount = Math.round(amountGross * commissionRate * 100) / 100;
    const eligibleAt = new Date();
    eligibleAt.setDate(eligibleAt.getDate() + ELIGIBILITY_DELAY_DAYS);

    await prisma.commissionLedger.create({
      data: {
        affiliateId,
        referredUserId,
        subscriptionEventId,
        amountGross,
        currency,
        commissionRate,
        commissionAmount,
        status: 'pending',
        eligibleAt,
      },
    });

    console.log(
      `[Commission] +${commissionAmount}${currency} pour affilié ${affiliateId} ` +
      `(user ${referredUserId}, event ${subscriptionEventId})`
    );

    return { created: true };
  }

  /**
   * Reverse toutes les commissions pending/eligible liées à un user référé.
   * Appelé typiquement sur un refund Superwall.
   */
  static async reverseCommissions(
    referredUserId: string,
    reason: string,
    subscriptionEventId?: string,
  ): Promise<number> {
    const where: Record<string, unknown> = {
      referredUserId,
      status: { in: ['pending', 'eligible'] },
    };
    if (subscriptionEventId) {
      where.subscriptionEventId = subscriptionEventId;
    }

    const result = await prisma.commissionLedger.updateMany({
      where,
      data: {
        status: 'reversed',
        reversedAt: new Date(),
        reverseReason: reason,
      },
    });

    if (result.count > 0) {
      console.log(
        `[Commission] ${result.count} commission(s) reversed pour user ${referredUserId}: ${reason}`
      );
    }

    return result.count;
  }

  /**
   * Promote les commissions pending dont la date d'éligibilité est passée.
   * À appeler via cron ou manuellement.
   */
  static async promoteEligible(): Promise<number> {
    const result = await prisma.commissionLedger.updateMany({
      where: {
        status: 'pending',
        eligibleAt: { lte: new Date() },
      },
      data: {
        status: 'eligible',
      },
    });

    if (result.count > 0) {
      console.log(`[Commission] ${result.count} commission(s) promues en eligible`);
    }

    return result.count;
  }
}
