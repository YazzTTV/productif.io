import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, metadata } = body

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
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

    // Récupérer les informations de la requête
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || ''

    // Extraire les paramètres UTM du referrer si disponibles
    let utmSource, utmMedium, utmCampaign
    if (referrer) {
      const url = new URL(referrer)
      utmSource = url.searchParams.get('utm_source')
      utmMedium = url.searchParams.get('utm_medium') 
      utmCampaign = url.searchParams.get('utm_campaign')
    }

    // Créer ou mettre à jour le lead
    const lead = await prisma.waitlistLead.upsert({
      where: { email },
      update: {
        // Si l'email existe déjà, on met juste à jour le timestamp
        updatedAt: new Date(),
        ipAddress,
        userAgent,
        referrer,
        ...(utmSource && { utmSource }),
        ...(utmMedium && { utmMedium }),
        ...(utmCampaign && { utmCampaign })
      },
      create: {
        email,
        status: 'EMAIL_ONLY',
        emailCapturedAt: new Date(),
        ipAddress,
        userAgent,
        referrer,
        ...(utmSource && { utmSource }),
        ...(utmMedium && { utmMedium }),
        ...(utmCampaign && { utmCampaign })
      }
    })

    console.log(`Email capturé: ${email} (ID: ${lead.id})`)

    return NextResponse.json({ 
      success: true, 
      message: 'Email enregistré avec succès',
      leadId: lead.id 
    })

  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'email:', error)
    
    // Gérer l'erreur de contrainte unique
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Cet email est déjà enregistré' },
        { status: 409 }
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