import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, phone, motivation, step } = body

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }

    // Vérifier si l'email existe déjà
    let waitlistEntry = await prisma.waitlistEntry.findUnique({
      where: { email }
    })

    if (step === 1) {
      // Étape 1: Sauvegarde de l'email
      if (waitlistEntry) {
        // Mettre à jour l'entrée existante
        waitlistEntry = await prisma.waitlistEntry.update({
          where: { email },
          data: {
            currentStep: 1,
            updatedAt: new Date()
          }
        })
      } else {
        // Créer une nouvelle entrée
        waitlistEntry = await prisma.waitlistEntry.create({
          data: {
            email,
            currentStep: 1,
            status: "pas_paye"
          }
        })
      }
    } else if (step === 2) {
      // Étape 2: Ajout du téléphone et motivation
      if (!phone || !motivation) {
        return NextResponse.json({ error: "Téléphone et motivation requis" }, { status: 400 })
      }

      if (!waitlistEntry) {
        return NextResponse.json({ error: "Email non trouvé" }, { status: 404 })
      }

      waitlistEntry = await prisma.waitlistEntry.update({
        where: { email },
        data: {
          phone,
          motivation,
          currentStep: 2,
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: waitlistEntry
    })

  } catch (error) {
    console.error("Erreur waitlist:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const entries = await prisma.waitlistEntry.findMany({
      orderBy: { createdAt: 'desc' }
    })

    const stats = {
      total: entries.length,
      payes: entries.filter(e => e.status === "paye").length,
      pasPayes: entries.filter(e => e.status === "pas_paye").length,
      etape1: entries.filter(e => e.currentStep === 1).length,
      etape2: entries.filter(e => e.currentStep === 2).length,
      etape3: entries.filter(e => e.currentStep === 3).length,
    }

    return NextResponse.json({
      entries,
      stats
    })

  } catch (error) {
    console.error("Erreur récupération waitlist:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
} 