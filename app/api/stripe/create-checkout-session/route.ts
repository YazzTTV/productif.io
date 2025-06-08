import { NextResponse } from 'next/server';
import { stripe, TRIAL_PERIOD_DAYS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    console.log('Starting checkout session creation...');
    // Afficher l'ID de prix utilisé
    console.log('Using STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID);

    const { userId } = await req.json();
    console.log('Received userId:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
      },
    });

    console.log('Found user:', user);

    if (!user) {
      console.log('User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      console.log('Creating new Stripe customer for user:', user.id);
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;
      console.log('Successfully created Stripe customer:', customer.id);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripeCustomerId: stripeCustomerId,
        },
      });
      console.log('Updated user with Stripe customer ID');
    }

    // Paramètres simplifiés pour la session de paiement
    const sessionParams = {
      customer: stripeCustomerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription' as const,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/merci?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      subscription_data: {
        trial_period_days: TRIAL_PERIOD_DAYS,
      },
      metadata: {
        userId: user.id,
      },
    };
    
    console.log('Creating checkout session...');
    
    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log('Session created with URL:', session.url);

    // Renvoyer uniquement l'URL de la session
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error in checkout session creation:', error.message);
    if (error.type === 'StripeInvalidRequestError') {
      console.error('Stripe invalid request details:', {
        message: error.message,
        param: error.param,
        code: error.code
      });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 