import { NextRequest, NextResponse } from 'next/server'
import { verifyApiToken } from '@/middleware/api-auth'
import prisma from '@/lib/prisma'

// GET : récupérer la config de planning
export async function GET(req: NextRequest) {
  const verification = await verifyApiToken(req, ['behavior:read'])
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error }, { status: 401 })
  }

  const userId = verification.payload.userId

  let schedule = await prisma.checkInSchedule.findUnique({
    where: { userId }
  })

  // Créer config par défaut si n'existe pas
  if (!schedule) {
    schedule = await prisma.checkInSchedule.create({
      data: {
        userId,
        enabled: true,
        frequency: '3x_daily',
        schedules: [
          { time: '09:00', types: ['mood', 'energy'] },
          { time: '14:00', types: ['focus', 'motivation'] },
          { time: '18:00', types: ['mood', 'stress'] }
        ],
        randomize: true,
        skipWeekends: false
      }
    })
  }

  return NextResponse.json({ schedule })
}

// PATCH : mettre à jour la config
export async function PATCH(req: NextRequest) {
  const verification = await verifyApiToken(req, ['behavior:write'])
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error }, { status: 401 })
  }

  const updates = await req.json()
  const userId = verification.payload.userId

  const schedule = await prisma.checkInSchedule.upsert({
    where: { userId },
    create: {
      userId,
      ...updates
    },
    update: updates
  })

  return NextResponse.json({ schedule })
}
