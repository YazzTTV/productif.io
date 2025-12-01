import { NextRequest, NextResponse } from 'next/server'
import { verifyApiToken, hasRequiredScopes } from '@/lib/api-token'
import { getAuthUserFromRequest, getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST : enregistrer un check-in (WhatsApp OU web)
export async function POST(req: NextRequest) {
  // 1) Essayer avec un token API (flux WhatsApp / intégrations)
  const authHeader = req.headers.get('authorization')

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

  const { type, value, note, context } = await req.json()

  // Validation
  if (!['mood', 'focus', 'motivation', 'energy', 'stress'].includes(type)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  }

  if (value < 1 || value > 10) {
    return NextResponse.json({ error: 'Valeur doit être entre 1 et 10' }, { status: 400 })
  }

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
  
  const where: any = {
    userId,
    timestamp: {
      gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
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
