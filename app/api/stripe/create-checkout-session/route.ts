import { NextRequest, NextResponse } from 'next/server';
import { stripe, TRIAL_PERIOD_DAYS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    console.log('Starting checkout session creation...');
    console.log('Request headers:', {
      authorization: req.headers.get('authorization') ? 'present' : 'missing',
      'content-type': req.headers.get('content-type'),
    });

    // Extraire l'utilisateur depuis le token JWT AVANT de parser le body
    // (car getAuthUserFromRequest lit les headers, pas le body)
    const authUser = await getAuthUserFromRequest(req);
    console.log('Auth user from request:', authUser ? { id: authUser.id, email: authUser.email } : 'null');
    
    // Parser le body après l'authentification
    const body = await req.json();
    const { billingType, userId: bodyUserId } = body;
    console.log('📦 [CHECKOUT] Body reçu:', JSON.stringify(body, null, 2));
    console.log('📦 [CHECKOUT] Billing type from body:', billingType);
    console.log('📦 [CHECKOUT] Type de billingType:', typeof billingType);
    console.log('📦 [CHECKOUT] User ID from body (fallback):', bodyUserId);
    
    // Déterminer le userId : priorité au token, fallback au body
    let userId: string | undefined;
    
    if (authUser?.id) {
      userId = authUser.id;
      console.log('Using userId from token:', userId);
    } else if (bodyUserId) {
      userId = bodyUserId;
      console.log('Using userId from body (fallback):', userId);
    } else {
      console.error('No userId found in token or body');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID manquant' }, { status: 401 });
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

    // Pick price based on billing type (accept both 'annual' and 'yearly')
    const isAnnual = billingType === 'yearly' || billingType === 'annual';
    const yearlyPriceId = process.env.STRIPE_PRICE_YEARLY_ID;
    const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY_ID;
    const priceId = isAnnual ? yearlyPriceId : monthlyPriceId;

    console.log('💰 [CHECKOUT] Billing type check:', {
      received: billingType,
      isAnnual,
      yearlyPriceId: yearlyPriceId || 'MISSING',
      monthlyPriceId: monthlyPriceId || 'MISSING',
      selectedPriceId: priceId || 'MISSING',
      priceType: isAnnual ? 'YEARLY' : 'MONTHLY'
    });

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured for selected billing type' }, { status: 500 });
    }

    // URLs pour le mobile app (détectées dans le WebView)
    // Pour le web, utiliser les URLs normales
    const isMobile = req.headers.get('user-agent')?.includes('Mobile') || false;
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const successURL = isMobile 
      ? `${baseURL}/merci?success=true&mobile=true`
      : `${baseURL}/merci?success=true`;
    const cancelURL = isMobile
      ? `${baseURL}/upgrade?canceled=true&mobile=true`
      : `${baseURL}/upgrade?canceled=true`;

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
        billingType: (billingType === 'yearly' || billingType === 'annual') ? 'annual' : 'monthly',
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