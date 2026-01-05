import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET : récupérer les données d'onboarding
export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const onboardingData = await prisma.onboardingData.findUnique({
      where: { userId: user.id }
    })

    return NextResponse.json({ data: onboardingData })
  } catch (error) {
    console.error('Erreur GET onboarding data:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST/PUT : sauvegarder les données d'onboarding
export async function POST(req: NextRequest) {
  console.log('\n🔔 [ONBOARDING_API] Nouvelle requête POST reçue')
  
  const authHeader = req.headers.get('authorization')
  console.log('🔍 [ONBOARDING_API] Authorization header:', authHeader ? 'présent' : 'absent')
  
  const user = await getAuthUserFromRequest(req)
  
  if (!user) {
    console.log('❌ [ONBOARDING_API] Requête non authentifiée')
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  console.log(`✅ [ONBOARDING_API] Utilisateur authentifié: ${user.id} (${user.email})`)

  try {
    const data = await req.json()
    console.log('📥 [ONBOARDING_API] Données reçues:', JSON.stringify(data, null, 2))
    
    // Construire l'objet de mise à jour avec tous les champs possibles
    const updateData: any = {}
    
    // Champs de base (ancien + nouveau)
    if (data.language !== undefined) updateData.language = data.language
    if (data.mainGoal !== undefined) updateData.mainGoal = data.mainGoal
    if (data.role !== undefined) updateData.role = data.role
    if (data.frustration !== undefined) updateData.frustration = data.frustration
    
    // Nouveau design - Identité
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.studentType !== undefined) updateData.studentType = data.studentType
    
    // Nouveau design - Objectifs & Pression
    if (data.goals !== undefined) updateData.goals = data.goals
    if (data.pressureLevel !== undefined) updateData.pressureLevel = data.pressureLevel
    
    // Nouveau design - Contexte académique
    if (data.currentSituation !== undefined) updateData.currentSituation = data.currentSituation
    
    // Nouveau design - Difficultés quotidiennes
    if (data.dailyStruggles !== undefined) updateData.dailyStruggles = data.dailyStruggles
    
    // Nouveau design - Style de travail
    if (data.mentalLoad !== undefined) updateData.mentalLoad = data.mentalLoad
    if (data.focusQuality !== undefined) updateData.focusQuality = data.focusQuality
    if (data.satisfaction !== undefined) updateData.satisfaction = data.satisfaction
    if (data.overthinkTasks !== undefined) updateData.overthinkTasks = data.overthinkTasks
    if (data.shouldDoMore !== undefined) updateData.shouldDoMore = data.shouldDoMore
    
    // Nouveau design - Intentions
    if (data.wantToChange !== undefined) updateData.wantToChange = data.wantToChange
    if (data.timeHorizon !== undefined) updateData.timeHorizon = data.timeHorizon
    
    // Nouveau design - Tâches & Journée idéale
    if (data.rawTasks !== undefined) updateData.rawTasks = data.rawTasks
    if (data.clarifiedTasks !== undefined) updateData.clarifiedTasks = data.clarifiedTasks
    if (data.idealDay !== undefined) updateData.idealDay = data.idealDay
    
    // WhatsApp
    if (data.whatsappNumber !== undefined) updateData.whatsappNumber = data.whatsappNumber
    if (data.whatsappConsent !== undefined) updateData.whatsappConsent = data.whatsappConsent
    
    // Questionnaire ancien
    if (data.diagBehavior !== undefined) updateData.diagBehavior = data.diagBehavior
    if (data.timeFeeling !== undefined) updateData.timeFeeling = data.timeFeeling
    if (data.phoneHabit !== undefined) updateData.phoneHabit = data.phoneHabit
    
    // Métadonnées
    if (data.offer !== undefined) updateData.offer = data.offer
    if (data.utmParams !== undefined) updateData.utmParams = data.utmParams
    if (data.emailFallback !== undefined) updateData.emailFallback = data.emailFallback
    if (data.billingCycle !== undefined) updateData.billingCycle = data.billingCycle
    
    // Progression
    if (data.currentStep !== undefined) updateData.currentStep = data.currentStep
    if (data.completed !== undefined) updateData.completed = data.completed
    
    const onboardingData = await prisma.onboardingData.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        language: data.language || 'fr',
        mainGoal: data.mainGoal || null,
        role: data.role || null,
        frustration: data.frustration || null,
        firstName: data.firstName || null,
        studentType: data.studentType || null,
        goals: data.goals || null,
        pressureLevel: data.pressureLevel || null,
        currentSituation: data.currentSituation || null,
        dailyStruggles: data.dailyStruggles || null,
        mentalLoad: data.mentalLoad || null,
        focusQuality: data.focusQuality || null,
        satisfaction: data.satisfaction || null,
        overthinkTasks: data.overthinkTasks ?? null,
        shouldDoMore: data.shouldDoMore ?? null,
        wantToChange: data.wantToChange || null,
        timeHorizon: data.timeHorizon || null,
        rawTasks: data.rawTasks || null,
        clarifiedTasks: data.clarifiedTasks || null,
        idealDay: data.idealDay || null,
        whatsappNumber: data.whatsappNumber || null,
        whatsappConsent: data.whatsappConsent ?? false,
        diagBehavior: data.diagBehavior || null,
        timeFeeling: data.timeFeeling || null,
        phoneHabit: data.phoneHabit || null,
        offer: data.offer || null,
        utmParams: data.utmParams || null,
        emailFallback: data.emailFallback || null,
        billingCycle: data.billingCycle || null,
        currentStep: data.currentStep || 1,
        completed: data.completed ?? false
      },
      update: updateData
    })
    
    // Mettre à jour le prénom de l'utilisateur si fourni
    if (data.firstName) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: data.firstName }
      })
    }
    
    console.log(`✅ [ONBOARDING_API] Sauvegardé pour userId: ${user.id}`)

    return NextResponse.json({ data: onboardingData })
  } catch (error) {
    console.error('❌ [ONBOARDING_API] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT : mettre à jour les données d'onboarding
export async function PUT(req: NextRequest) {
  return POST(req)
}

