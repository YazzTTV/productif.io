import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { TrialService } from '@/lib/trial/TrialService';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription') {
          const userId = session.metadata?.userId;
          const billingType = session.metadata?.billingType;

          if (userId) {
            // Récupérer la subscription
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            );

            // Convertir le trial en subscription
            await TrialService.convertTrialToSubscription(
              userId,
              session.customer as string,
              subscription.id,
              billingType === 'yearly' ? 'yearly' : 'monthly'
            );

            console.log(`✅ Subscription activée pour user ${userId}`);
          }
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // Mettre à jour le statut si annulation programmée
        if (subscription.cancel_at_period_end) {
          await prisma.user.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              subscriptionStatus: 'cancelled',
              cancelledAt: new Date()
            }
          });

          console.log(`⚠️ Subscription annulée (fin de période) pour subscription ${subscription.id}`);
        } else {
          // Réactivation potentielle
          const now = new Date();
          if (subscription.current_period_end) {
            const subscriptionEndDate = new Date(subscription.current_period_end * 1000);
            
            await prisma.user.update({
              where: { stripeSubscriptionId: subscription.id },
              data: {
                subscriptionStatus: 'active',
                subscriptionEndDate,
                cancelledAt: null
              }
            });

            console.log(`✅ Subscription réactivée pour subscription ${subscription.id}`);
          }
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Désactiver l'accès
        await prisma.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionStatus: 'expired',
            subscriptionEndDate: new Date()
          }
        });

        console.log(`❌ Subscription expirée: ${subscription.id}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          // Mettre à jour la date de fin d'abonnement
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          if (subscription.current_period_end) {
            const subscriptionEndDate = new Date(subscription.current_period_end * 1000);

            await prisma.user.update({
              where: { stripeSubscriptionId: subscription.id },
              data: {
                subscriptionEndDate,
                subscriptionStatus: 'active'
              }
            });

            console.log(`✅ Paiement reçu, subscription mise à jour: ${subscription.id}`);
          }
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          console.warn(`⚠️ Paiement échoué pour subscription: ${invoice.subscription}`);
          
          // Optionnel: envoyer une notification à l'utilisateur
          // ou mettre un flag pour alerter qu'il y a un problème de paiement
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erreur traitement webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

