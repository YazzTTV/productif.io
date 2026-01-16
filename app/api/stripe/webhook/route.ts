import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature')!;

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        console.log('Processing checkout.session.completed:', session.id);

        // Vérifier si c'est un paiement waitlist
        if (session.metadata && session.metadata.type === 'waitlist') {
          const email = session.metadata.email || session.customer_email;
          
          if (email) {
            console.log(`Marking waitlist entry as paid for email: ${email}`);
            
            try {
              await prisma.waitlistEntry.update({
                where: { email },
                data: {
                  status: 'paye',
                  currentStep: 3,
                  updatedAt: new Date()
                }
              });
              console.log(`✅ Successfully updated waitlist status for ${email}`);
            } catch (error) {
              console.error(`❌ Error updating waitlist for ${email}:`, error);
            }
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata.userId;

        // Mettre à jour le statut et le tier (premium si subscription active)
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionTier: isActive ? 'pro' : null, // Mettre 'pro' si active, sinon null (freemium)
            trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            subscriptionEndDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata.userId;

        // Remettre en freemium quand la subscription est supprimée
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'free',
            subscriptionTier: 'free',
            stripeSubscriptionId: null,
            trialEndsAt: null,
            subscriptionEndDate: null,
          },
        });
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 