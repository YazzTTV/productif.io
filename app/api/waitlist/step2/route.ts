import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, reason } = body

    // Validation
    if (!email || !phone || !reason) {
      return NextResponse.json(
        { error: 'Email, téléphone et raison sont requis' },
        { status: 400 }
      )
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    // Validation téléphone (format simple)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Format de téléphone invalide' },
        { status: 400 }
      )
    }

    // Vérifier que l'email existe déjà
    const existingLead = await prisma.waitlistLead.findUnique({
      where: { email }
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Email non trouvé. Veuillez recommencer depuis l\'étape 1.' },
        { status: 404 }
      )
    }

    // Mettre à jour avec les nouvelles informations
    const updatedLead = await prisma.waitlistLead.update({
      where: { email },
      data: {
        phone,
        reason,
        phoneAddedAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log(`Informations complétées pour: ${email} (ID: ${updatedLead.id})`)

    return NextResponse.json({ 
      success: true, 
      message: 'Informations enregistrées avec succès',
      leadId: updatedLead.id 
    })

  } catch (error) {
    console.error('Erreur lors de la sauvegarde des informations:', error)

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 