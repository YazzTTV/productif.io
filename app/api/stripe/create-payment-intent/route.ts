import { NextResponse } from 'next/server';
import { stripe, TRIAL_PERIOD_DAYS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const { userId, billingType } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

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

    // Ensure customer exists
    let stripeCustomerId = user.stripeCustomerId || undefined;
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (e: any) {
        if (e?.code === 'resource_missing') {
          await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: null } });
          stripeCustomerId = undefined;
        } else {
          throw e;
        }
      }
    }

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

    // Pick price based on billing type (accept both 'annual' and 'yearly')
    const priceId = (billingType === 'yearly' || billingType === 'annual')
      ? process.env.STRIPE_PRICE_YEARLY_ID
      : process.env.STRIPE_PRICE_MONTHLY_ID;

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 });
    }

    // Get price details to calculate amount
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;

    // Create SetupIntent for subscription (Apple Pay/Google Pay)
    // This allows us to collect payment method and create subscription later
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        userId: user.id,
        billingType: billingType || 'monthly',
        priceId: priceId,
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomerId,
      amount: amount / 100, // Convert from cents to dollars
      currency: price.currency,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

