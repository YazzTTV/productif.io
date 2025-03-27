import { NextResponse } from "next/server"
import { stripe, TRIAL_PERIOD_DAYS } from "@/lib/stripe"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { paymentMethodId } = body

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Méthode de paiement requise" },
        { status: 400 }
      )
    }

    // Créer ou récupérer le client Stripe
    let stripeCustomerId = user.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
      stripeCustomerId = customer.id

      // Mettre à jour l'utilisateur avec son ID client Stripe
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      })
    }

    // Créer l'abonnement avec période d'essai
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      trial_period_days: TRIAL_PERIOD_DAYS,
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    })

    // Mettre à jour l'utilisateur avec les informations d'abonnement
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        trialEndsAt: new Date(subscription.trial_end! * 1000)
      }
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent?.client_secret
    })

  } catch (error: any) {
    console.error('Erreur lors de la création de l\'abonnement:', error)
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création de l'abonnement" },
      { status: 500 }
    )
  }
} 