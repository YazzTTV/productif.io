import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }

    // Vérifier que l'entrée waitlist existe et est à l'étape 2
    const waitlistEntry = await prisma.waitlistEntry.findUnique({
      where: { email }
    })

    if (!waitlistEntry) {
      return NextResponse.json({ error: "Email non trouvé dans la waitlist" }, { status: 404 })
    }

    if (waitlistEntry.currentStep < 2) {
      return NextResponse.json({ error: "Étapes précédentes non complétées" }, { status: 400 })
    }

    // Créer la session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Productif.io - Waitlist Exclusive',
              description: 'Accès anticipé + tarif lifetime préférentiel',
            },
            unit_amount: 100, // 1€ en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/waitlist/success?email=${encodeURIComponent(email)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/waitlist?step=3&email=${encodeURIComponent(email)}`,
      customer_email: email,
      metadata: {
        email: email,
        type: 'waitlist'
      }
    })

    // Mettre à jour l'entrée waitlist avec l'ID de session
    await prisma.waitlistEntry.update({
      where: { email },
      data: {
        currentStep: 3,
        stripeSessionId: session.id,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error("Erreur création session Stripe:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    )
  }
} 