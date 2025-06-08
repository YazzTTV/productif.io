import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, reason } = body

    // Validation
    if (!email || !phone || !reason) {
      return NextResponse.json(
        { error: 'Toutes les informations sont requises' },
        { status: 400 }
      )
    }

    // Vérifier que le lead existe
    const existingLead = await prisma.waitlistLead.findUnique({
      where: { email }
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead non trouvé. Veuillez recommencer le processus.' },
        { status: 404 }
      )
    }

    // Créer une session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Waitlist Exclusive Productif.io',
              description: 'Accès prioritaire + tarif préférentiel à vie',
            },
            unit_amount: 100, // 1€ en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/inscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/inscription?cancelled=true`,
      customer_email: email,
      metadata: {
        leadEmail: email,
        phone: phone,
        reason: reason.substring(0, 500), // Limiter la taille
        leadId: existingLead.id
      }
    })

    // Sauvegarder l'ID de session
    await prisma.waitlistLead.update({
      where: { email },
      data: {
        stripeSessionId: session.id,
        updatedAt: new Date()
      }
    })

    console.log(`Session Stripe créée pour: ${email} (Session: ${session.id})`)

    return NextResponse.json({ 
      success: true,
      url: session.url,
      sessionId: session.id
    })

  } catch (error) {
    console.error('Erreur lors de la création de la session Stripe:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: 'Erreur de paiement: ' + error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 