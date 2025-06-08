import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID requis' },
        { status: 400 }
      )
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Paiement non confirmé' },
        { status: 400 }
      )
    }

    // Récupérer le lead correspondant
    const lead = await prisma.waitlistLead.findUnique({
      where: { stripeSessionId: sessionId }
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le statut du lead si pas déjà fait
    if (lead.status !== 'PAID') {
      await prisma.waitlistLead.update({
        where: { id: lead.id },
        data: {
          status: 'PAID',
          amountPaid: session.amount_total,
          paidAt: new Date(),
          completedAt: new Date(),
          updatedAt: new Date()
        }
      })

      console.log(`Lead ${lead.email} marqué comme payé (${session.amount_total} centimes)`)
    }

    return NextResponse.json({ 
      success: true,
      lead: {
        email: lead.email,
        status: 'PAID',
        paidAt: lead.paidAt || new Date()
      }
    })

  } catch (error) {
    console.error('Erreur lors de la vérification du paiement:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { success: false, error: 'Erreur Stripe: ' + error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 