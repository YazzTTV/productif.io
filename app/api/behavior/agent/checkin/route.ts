import { NextRequest, NextResponse } from 'next/server'
import { verifyApiToken, hasRequiredScopes } from '@/lib/api-token'
import { getAuthUserFromRequest, getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanInfo, buildLockedFeature } from '@/lib/plans'

// POST : enregistrer un check-in (WhatsApp OU web)
export async function POST(req: NextRequest) {
  console.log('💾 [CheckIn] Requête POST reçue');
  // 1) Essayer avec un token API (flux WhatsApp / intégrations)
  const authHeader = req.headers.get('authorization')
  console.log('🔑 [CheckIn] Header Authorization présent:', !!authHeader);

  let userId: string | null = null
  let verificationError: string | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const decoded = await verifyApiToken(token)

    if (decoded) {
      const requiredScopes = ['behavior:write']
      if (hasRequiredScopes(decoded.scopes, requiredScopes)) {
        userId = decoded.userId
      } else {
        verificationError = 'Permissions insuffisantes'
      }
    } else {
      verificationError = 'Token API invalide ou expiré'
    }
  }

  // 2) Sinon, tenter via utilisateur authentifié (cookies / session web)
  if (!userId) {
    console.log('🔍 [CheckIn] Tentative d\'authentification via getAuthUserFromRequest...');
    let user = await getAuthUserFromRequest(req as any)
    if (!user) {
      console.log('🔍 [CheckIn] Tentative d\'authentification via getAuthUser...');
      user = await getAuthUser()
    }
    if (!user) {
      console.error('❌ [CheckIn] Utilisateur non authentifié');
      return NextResponse.json(
        { error: verificationError || 'Non authentifié' },
        { status: 401 }
      )
    }
    userId = user.id
    console.log('✅ [CheckIn] Utilisateur authentifié:', userId);
  }

  const body = await req.json()
  const { type, value, note, context } = body
  console.log('📝 [CheckIn] Données reçues:', { type, value, note: note ? 'présente' : 'absente' });

  // Validation
  if (!['mood', 'focus', 'motivation', 'energy', 'stress'].includes(type)) {
    console.error('❌ [CheckIn] Type invalide:', type);
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  }

  if (value < 1 || value > 10) {
    console.error('❌ [CheckIn] Valeur invalide:', value);
    return NextResponse.json({ error: 'Valeur doit être entre 1 et 10' }, { status: 400 })
  }

  console.log('💾 [CheckIn] Création du check-in dans la base de données...');
  const checkIn = await prisma.behaviorCheckIn.create({
    data: {
      userId,
      type,
      value,
      note,
      context,
      triggeredBy: 'manual'
    }
  })

  console.log('✅ [CheckIn] Check-in créé avec succès:', checkIn.id);

  return NextResponse.json({
    checkIn,
    message: `${getTypeEmoji(type)} Check-in enregistré ! (${value}/10)`
  })
}

// GET : récupérer les check-ins récents
export async function GET(req: NextRequest) {
  // 1) Essayer via token API
  const authHeader = req.headers.get('authorization')

  let userId: string | null = null
  let verificationError: string | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const decoded = await verifyApiToken(token)

    if (decoded) {
      const requiredScopes = ['behavior:read']
      if (hasRequiredScopes(decoded.scopes, requiredScopes)) {
        userId = decoded.userId
      } else {
        verificationError = 'Permissions insuffisantes'
      }
    } else {
      verificationError = 'Token API invalide ou expiré'
    }
  }

  // 2) Sinon, utilisateur web authentifié
  if (!userId) {
    let user = await getAuthUserFromRequest(req as any)
    if (!user) {
      user = await getAuthUser()
    }
    if (!user) {
      return NextResponse.json(
        { error: verificationError || 'Non authentifié' },
        { status: 401 }
      )
    }
    userId = user.id
  }

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '7')
  const type = searchParams.get('type')

  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true, subscriptionTier: true, stripeSubscriptionId: true },
  })

  const planInfo = userRecord ? getPlanInfo(userRecord) : null
  const limits = planInfo?.limits

  if (limits?.historyDepthDays !== null && days > limits.historyDepthDays) {
    return NextResponse.json(
      {
        error: `Historique détaillé réservé au plan Premium (max ${limits.historyDepthDays} jours en freemium)`,
        ...buildLockedFeature('history'),
        plan: planInfo?.plan ?? 'free',
        planLimits: limits,
        usage: {
          requestedDays: days,
          allowedDays: limits.historyDepthDays,
        },
      },
      { status: 403 }
    )
  }

  const effectiveDays = limits?.historyDepthDays !== null ? Math.min(days, limits.historyDepthDays) : days
  
  const where: any = {
    userId,
    timestamp: {
      gte: new Date(Date.now() - effectiveDays * 24 * 60 * 60 * 1000)
    }
  }

  if (type) {
    where.type = type
  }

  const checkIns = await prisma.behaviorCheckIn.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: 100
  })

  return NextResponse.json({ checkIns })
}

function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    mood: '😊',
    focus: '🎯',
    motivation: '🔥',
    energy: '⚡',
    stress: '😰'
  }
  return emojis[type] || '📊'
}
