import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CommissionService } from '@/lib/affiliate/CommissionService';

const SUPERWALL_WEBHOOK_SECRET = process.env.SUPERWALL_WEBHOOK_SECRET;

const REVENUE_EVENTS = new Set([
  'initial_purchase',
  'renewal',
  'non_renewing_purchase',
]);

interface SuperwallWebhookPayload {
  object: string;
  type: string;
  projectId: number;
  applicationId: number;
  timestamp: number;
  data: {
    id: string;
    name: string;
    cancelReason: string | null;
    periodType: string; // TRIAL | INTRO | NORMAL
    price: number; // USD, negative = refund
    proceeds: number;
    priceInPurchasedCurrency: number;
    transactionId: string;
    originalTransactionId: string;
    originalAppUserId: string | null;
    store: string;
    purchasedAt: number;
    expirationAt: number | null;
    currencyCode: string;
    productId: string;
    environment: string;
    isTrialConversion: boolean;
    newProductId: string | null;
    bundleId: string;
    ts: number;
    userAttributes?: Record<string, unknown>;
  };
}

/**
 * L'identifiant du compte. Un achat fait avant identify arrive sous un alias
 * `$SuperwallAlias:` ; on se rabat alors sur l'attribut `productifUserId` que
 * l'app pose sur l'utilisateur Superwall depuis le 25 septembre.
 */
function resolveUserId(
  originalAppUserId: string | null,
  userAttributes?: Record<string, unknown>
): string | null {
  if (originalAppUserId && !originalAppUserId.startsWith('$SuperwallAlias:')) return originalAppUserId;
  const fromAttributes = userAttributes?.productifUserId ?? userAttributes?.appUserId;
  if (typeof fromAttributes === 'string' && fromAttributes && !fromAttributes.startsWith('$SuperwallAlias:')) {
    return fromAttributes;
  }
  return null;
}

function mapEventToSubscriptionStatus(eventName: string, periodType: string): string | null {
  switch (eventName) {
    case 'initial_purchase':
      return periodType === 'TRIAL' ? 'trialing' : 'active';
    case 'renewal':
      return 'active';
    case 'non_renewing_purchase':
      return 'paid';
    // Une annulation (ou son retrait) ne change pas l'acces : Apple laisse
    // l'abonnement, ou l'essai, courir jusqu'a sa date de fin. C'est
    // l'expiration qui coupe. Avant, une annulation pendant l'essai passait le
    // statut a 'cancelled' et coupait l'acces sur-le-champ.
    case 'uncancellation':
    case 'cancellation':
      return null;
    case 'expiration':
    case 'refund':
      return 'expired';
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (SUPERWALL_WEBHOOK_SECRET) {
      const authHeader = req.headers.get('authorization');
      const secretHeader = req.headers.get('x-webhook-secret');
      const token = authHeader?.replace('Bearer ', '') || secretHeader;
      if (token !== SUPERWALL_WEBHOOK_SECRET) {
        console.warn('[Superwall Webhook] Secret invalide');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const payload: SuperwallWebhookPayload = await req.json();
    const { type, data } = payload;

    // Les achats de test (TestFlight, et surtout le reviewer Apple) debloquent
    // aussi le compte : ignores, le reviewer achetait et restait en gratuit, ce
    // qui est un motif de rejet. Pas de commission sur un achat de test.
    const isSandbox = data.environment === 'SANDBOX';

    const userId = resolveUserId(data.originalAppUserId, data.userAttributes);
    if (!userId) {
      console.warn(`[Superwall Webhook] Pas de userId résolvable pour event ${type}, originalAppUserId=${data.originalAppUserId}`);
      return NextResponse.json({ received: true, skipped: 'no_user_id' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referredBy: true, subscriptionStatus: true },
    });
    if (!user) {
      console.warn(`[Superwall Webhook] User ${userId} introuvable`);
      return NextResponse.json({ received: true, skipped: 'user_not_found' });
    }

    const isRefund = data.price < 0;
    const eventName = isRefund ? 'refund' : data.name;

    let subscriptionEvent;
    try {
      subscriptionEvent = await prisma.subscriptionEvent.create({
        data: {
          userId: user.id,
          eventName,
          productId: data.productId,
          transactionId: data.transactionId || null,
          price: data.price,
          currency: data.currencyCode || 'USD',
          provider: isSandbox ? 'superwall_sandbox' : 'superwall',
          rawPayload: payload as unknown as Record<string, unknown>,
        },
      });
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002') {
        console.log(`[Superwall Webhook] Event dupliqué (transactionId=${data.transactionId}, event=${eventName})`);
        return NextResponse.json({ received: true, duplicate: true });
      }
      throw e;
    }

    const newStatus = mapEventToSubscriptionStatus(eventName, data.periodType);
    const updateData: Record<string, unknown> = {};

    if (newStatus) {
      updateData.subscriptionStatus = newStatus;
    }

    if (newStatus === 'active' || newStatus === 'paid') {
      updateData.subscriptionTier = 'premium';
      if (!user.subscriptionStatus || user.subscriptionStatus === 'trialing') {
        updateData.convertedAt = new Date();
      }
    }

    // Le tier 'premium' suffit a donner l'acces (lib/plans.ts, PREMIUM_TIERS) :
    // sans cette remise a zero, un abonne expire ou rembourse restait premium
    // pour toujours.
    if (newStatus === 'expired') {
      updateData.subscriptionTier = null;
    }

    if (data.expirationAt) {
      updateData.subscriptionEndDate = new Date(data.expirationAt);
    }

    if (eventName === 'cancellation') {
      updateData.cancelledAt = new Date();
    }
    if (eventName === 'uncancellation') {
      updateData.cancelledAt = null;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    if (isSandbox) {
      // aucune commission sur un achat de test
    } else if (isRefund) {
      const reversed = await CommissionService.reverseCommissions(
        user.id,
        `refund_${data.transactionId}`,
      );
      console.log(
        `[Superwall Webhook] REFUND user=${user.id} amount=${data.price} ` +
        `commissions_reversed=${reversed}`
      );
    } else if (REVENUE_EVENTS.has(eventName) && data.price > 0 && user.referredBy) {
      await CommissionService.createCommission({
        affiliateId: user.referredBy,
        referredUserId: user.id,
        subscriptionEventId: subscriptionEvent.id,
        amountGross: data.price,
        currency: data.currencyCode || 'USD',
      });
    }

    console.log(
      `[Superwall Webhook] ${isSandbox ? '[sandbox] ' : ''}${eventName} user=${user.id} price=${data.price} ` +
      `product=${data.productId} status→${newStatus || '(unchanged)'}`
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Superwall Webhook] Erreur:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
