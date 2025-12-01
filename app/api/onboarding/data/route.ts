import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Fonction pour obtenir l'utilisateur depuis les cookies
async function getAuthUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return null
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string }
    return decoded
  } catch (error) {
    return null
  }
}

// GET : récupérer les données d'onboarding
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const onboardingData = await prisma.onboardingData.findUnique({
      where: { userId: user.userId }
    })

    return NextResponse.json({ data: onboardingData })
  } catch (error) {
    console.error('Erreur GET onboarding data:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST/PUT : sauvegarder les données d'onboarding
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const data = await req.json()
    
    // Créer ou mettre à jour les données d'onboarding
    const onboardingData = await prisma.onboardingData.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        mainGoal: data.mainGoal,
        role: data.role,
        frustration: data.frustration,
        language: data.language || 'fr',
        whatsappNumber: data.whatsappNumber,
        whatsappConsent: data.whatsappConsent ?? false,
        diagBehavior: data.diagBehavior,
        timeFeeling: data.timeFeeling,
        phoneHabit: data.phoneHabit,
        offer: data.offer,
        utmParams: data.utmParams ? JSON.parse(JSON.stringify(data.utmParams)) : null,
        emailFallback: data.emailFallback,
        billingCycle: data.billingCycle,
        currentStep: data.currentStep,
        completed: data.completed ?? false
      },
      update: {
        mainGoal: data.mainGoal,
        role: data.role,
        frustration: data.frustration,
        language: data.language,
        whatsappNumber: data.whatsappNumber,
        whatsappConsent: data.whatsappConsent,
        diagBehavior: data.diagBehavior,
        timeFeeling: data.timeFeeling,
        phoneHabit: data.phoneHabit,
        offer: data.offer,
        utmParams: data.utmParams ? JSON.parse(JSON.stringify(data.utmParams)) : undefined,
        emailFallback: data.emailFallback,
        billingCycle: data.billingCycle,
        currentStep: data.currentStep,
        completed: data.completed
      }
    })

    return NextResponse.json({ data: onboardingData })
  } catch (error) {
    console.error('Erreur POST onboarding data:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT : mettre à jour les données d'onboarding
export async function PUT(req: NextRequest) {
  return POST(req) // Utiliser la même logique que POST
}

