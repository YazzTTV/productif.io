import { NextResponse } from 'next/server';
import { stripe, TRIAL_PERIOD_DAYS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    console.log('Starting checkout session creation...');

    const { userId, billingType } = await req.json();
    console.log('Received userId:', userId);
    console.log('Billing type:', billingType);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure customer exists for current Stripe environment
    let stripeCustomerId = user.stripeCustomerId || undefined;
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (e: any) {
        if (e?.code === 'resource_missing') {
          console.warn('Stale Stripe customerId for current environment. Recreating customer.');
          await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: null } });
          stripeCustomerId = undefined;
        } else {
          throw e;
        }
      }
    }

    // Create customer if missing
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    // Pick price based on billing type
    const priceId = billingType === 'yearly'
      ? process.env.STRIPE_PRICE_YEARLY_ID
      : process.env.STRIPE_PRICE_MONTHLY_ID;

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured for selected billing type' }, { status: 500 });
    }

    const successURL = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/merci?success=true`;
    const cancelURL = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upgrade?canceled=true`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successURL,
      cancel_url: cancelURL,
      metadata: {
        userId: user.id,
        billingType: billingType || 'monthly',
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log('Session created with URL:', session.url);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error in checkout session creation:', error?.message || error);
    if (error?.type === 'StripeInvalidRequestError') {
      console.error('Stripe invalid request details:', {
        message: error.message,
        param: error.param,
        code: error.code,
      });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 