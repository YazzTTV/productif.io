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
  
  // Log des headers pour déboguer
  const authHeader = req.headers.get('authorization')
  console.log('🔍 [ONBOARDING_API] Authorization header:', authHeader ? 'présent' : 'absent')
  if (authHeader) {
    console.log('🔍 [ONBOARDING_API] Token (premiers caractères):', authHeader.substring(0, 50) + '...')
  }
  
  const user = await getAuthUserFromRequest(req)
  
  if (!user) {
    console.log('❌ [ONBOARDING_API] Requête non authentifiée - aucun token trouvé')
    console.log('   - Auth header présent:', !!authHeader)
    console.log('   - Cookies présents:', !!req.cookies.get('auth_token')?.value)
    console.log('')
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  console.log(`✅ [ONBOARDING_API] Utilisateur authentifié: ${user.id} (${user.email})`)

  try {
    const data = await req.json()
    console.log('📥 [ONBOARDING_API] Données reçues:')
    console.log('   - userId:', user.id)
    console.log('   - userEmail:', user.email)
    console.log('   - mainGoal:', data.mainGoal || 'N/A')
    console.log('   - role:', data.role || 'N/A')
    console.log('   - frustration:', data.frustration || 'N/A')
    console.log('   - language:', data.language || 'N/A')
    console.log('   - diagBehavior:', data.diagBehavior || 'N/A')
    console.log('   - timeFeeling:', data.timeFeeling || 'N/A')
    console.log('   - phoneHabit:', data.phoneHabit || 'N/A')
    console.log('   - currentStep:', data.currentStep || 'N/A')
    console.log('   - completed:', data.completed || false)
    console.log('   - Toutes les données:', JSON.stringify(data, null, 2))
    
    // Créer ou mettre à jour les données d'onboarding
    // Ne mettre à jour que les champs qui sont fournis (pas undefined)
    const updateData: any = {}
    if (data.mainGoal !== undefined) updateData.mainGoal = data.mainGoal
    if (data.role !== undefined) updateData.role = data.role
    if (data.frustration !== undefined) updateData.frustration = data.frustration
    if (data.language !== undefined) updateData.language = data.language
    if (data.whatsappNumber !== undefined) updateData.whatsappNumber = data.whatsappNumber
    if (data.whatsappConsent !== undefined) updateData.whatsappConsent = data.whatsappConsent
    if (data.diagBehavior !== undefined) updateData.diagBehavior = data.diagBehavior
    if (data.timeFeeling !== undefined) updateData.timeFeeling = data.timeFeeling
    if (data.phoneHabit !== undefined) updateData.phoneHabit = data.phoneHabit
    if (data.offer !== undefined) updateData.offer = data.offer
    if (data.utmParams !== undefined) updateData.utmParams = data.utmParams ? JSON.parse(JSON.stringify(data.utmParams)) : null
    if (data.emailFallback !== undefined) updateData.emailFallback = data.emailFallback
    if (data.billingCycle !== undefined) updateData.billingCycle = data.billingCycle
    if (data.currentStep !== undefined) updateData.currentStep = data.currentStep
    if (data.completed !== undefined) updateData.completed = data.completed
    
    const onboardingData = await prisma.onboardingData.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        mainGoal: data.mainGoal || null,
        role: data.role || null,
        frustration: data.frustration || null,
        language: data.language || 'fr',
        whatsappNumber: data.whatsappNumber || null,
        whatsappConsent: data.whatsappConsent ?? false,
        diagBehavior: data.diagBehavior || null,
        timeFeeling: data.timeFeeling || null,
        phoneHabit: data.phoneHabit || null,
        offer: data.offer || null,
        utmParams: data.utmParams ? JSON.parse(JSON.stringify(data.utmParams)) : null,
        emailFallback: data.emailFallback || null,
        billingCycle: data.billingCycle || null,
        currentStep: data.currentStep || 1,
        completed: data.completed ?? false
      },
      update: updateData
    })
    
    console.log(`\n📊 [ONBOARDING_DATA] Sauvegardé pour userId: ${user.id} (${user.email})`)
    console.log('   - mainGoal:', updateData.mainGoal || 'N/A')
    console.log('   - diagBehavior:', updateData.diagBehavior || 'N/A')
    console.log('   - timeFeeling:', updateData.timeFeeling || 'N/A')
    console.log('   - phoneHabit:', updateData.phoneHabit || 'N/A')
    console.log('   - currentStep:', updateData.currentStep || 'N/A')
    console.log('   - completed:', updateData.completed || false)
    console.log('   - Toutes les données:', JSON.stringify(updateData, null, 2))
    console.log('✅ Sauvegarde réussie\n')

    return NextResponse.json({ data: onboardingData })
  } catch (error) {
    console.error('\n❌ [ONBOARDING_DATA] Erreur POST onboarding data:', error)
    console.error('   Détails:', error instanceof Error ? error.message : String(error))
    console.error('')
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT : mettre à jour les données d'onboarding
export async function PUT(req: NextRequest) {
  return POST(req) // Utiliser la même logique que POST
}

