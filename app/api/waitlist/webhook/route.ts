import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
})

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error("Erreur signature webhook:", err)
      return NextResponse.json({ error: "Signature invalide" }, { status: 400 })
    }

    // Gérer l'événement de paiement réussi
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      // Vérifier que c'est un paiement waitlist
      if (session.metadata?.type === "waitlist" && session.metadata?.email) {
        const email = session.metadata.email

        // Marquer comme payé dans la base de données
        await prisma.waitlistEntry.update({
          where: { email },
          data: {
            status: "paye",
            updatedAt: new Date()
          }
        })

        console.log(`Paiement waitlist confirmé pour: ${email}`)
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("Erreur webhook waitlist:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
} 