import { NextRequest, NextResponse } from 'next/server'
import { verifyApiToken } from '@/middleware/api-auth'
import prisma from '@/lib/prisma'

// POST : enregistrer un check-in
export async function POST(req: NextRequest) {
  const verification = await verifyApiToken(req, ['behavior:write'])
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error }, { status: 401 })
  }

  const { type, value, note, context } = await req.json()
  const userId = verification.payload.userId

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
  const verification = await verifyApiToken(req, ['behavior:read'])
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '7')
  const type = searchParams.get('type')
  
  const userId = verification.payload.userId

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
