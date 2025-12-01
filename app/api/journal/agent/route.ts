import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiAuth } from '@/middleware/api-auth'
import { getAuthUserFromRequest, getAuthUser } from '@/lib/auth'
import { verifyApiToken, hasRequiredScopes } from '@/lib/api-token'
import { analyzeJournalEntry } from '@/lib/ai/journal-analysis'

// Normalise une date à minuit (00:00:00)
function normalizeToDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(req: NextRequest) {
  let userId: string | null = null

  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''

    // 1) Essayer d'abord via l'utilisateur authentifié (cookies ou header)
    const webUser = await getAuthUserFromRequest(req)
    if (webUser) {
      userId = webUser.id
    } else {
      const cookieUser = await getAuthUser()
      if (cookieUser) {
        userId = cookieUser.id
      }
    }
    
    // 2) Si pas d'utilisateur, essayer avec un token API explicite
    if (!userId && token) {
      try {
        const payload = await verifyApiToken(token)
        if (payload) {
          // Vérifier les scopes pour les tokens API
          if (!hasRequiredScopes(payload.scopes, ['journal:read'])) {
            return NextResponse.json({ error: 'Permissions insuffisantes', requiredScopes: ['journal:read'] }, { status: 403 })
          }
          userId = payload.userId
        }
      } catch (error) {
        // Si la vérification du token API échoue, on continue avec null
        console.error('Erreur lors de la vérification du token API:', error)
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '7', 10)

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const entries = await prisma.journalEntry.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ entries })
  } catch (error: any) {
    console.error('GET /api/journal/agent error:', error)
    return NextResponse.json({ error: error?.message || 'Erreur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  let userId: string | null = null

  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''

    // 1) Essayer d'abord via l'utilisateur authentifié (cookies ou header)
    const webUser = await getAuthUserFromRequest(req)
    if (webUser) {
      userId = webUser.id
    } else {
      const cookieUser = await getAuthUser()
      if (cookieUser) {
        userId = cookieUser.id
      }
    }
    
    // 2) Si pas d'utilisateur, essayer avec un token API explicite
    if (!userId && token) {
      try {
        const payload = await verifyApiToken(token)
        if (payload) {
          // Vérifier les scopes pour les tokens API
          if (!hasRequiredScopes(payload.scopes, ['journal:write'])) {
            return NextResponse.json({ error: 'Permissions insuffisantes', requiredScopes: ['journal:write'] }, { status: 403 })
          }
          userId = payload.userId
        }
      } catch (error) {
        // Si la vérification du token API échoue, on continue avec null
        console.error('Erreur lors de la vérification du token API:', error)
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as { transcription?: string; date?: string }

    if (!body?.transcription || typeof body.transcription !== 'string') {
      return NextResponse.json({ error: 'transcription requise' }, { status: 400 })
    }

    const journalDate = normalizeToDay(body.date ? new Date(body.date) : new Date())

    // Créer l'entrée en mode non traitée d'abord
    const entry = await prisma.journalEntry.upsert({
      where: { userId_date: { userId, date: journalDate } },
      update: { transcription: body.transcription, processed: false, processingError: null },
      create: {
        userId,
        date: journalDate,
        transcription: body.transcription,
        processed: false
      }
    })

    // Traitement asynchrone: analyse IA puis update
    processJournalEntry(entry.id, body.transcription).catch((e) => {
      console.error('Background journal processing failed:', e)
    })

    return NextResponse.json({
      entry,
      message: "Journal reçu ! Je vais l'analyser et te donner mes insights demain matin 🌅"
    })
  } catch (error: any) {
    console.error('POST /api/journal/agent error:', error)
    return NextResponse.json({ error: error?.message || 'Erreur' }, { status: 500 })
  }
}

async function processJournalEntry(entryId: string, transcription: string) {
  try {
    // 1) Analyse IA
    const analysis = await analyzeJournalEntry(transcription)

    // 2) Mise à jour de l'entrée
    await prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        sentiment: analysis.sentiment,
        themes: analysis.themes,
        highlights: analysis.highlights,
        improvements: analysis.improvements,
        processed: true,
        processingError: null
      }
    })
  } catch (error: any) {
    await prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        processed: false,
        processingError: error?.message || 'Erreur inconnue'
      }
    })
    throw error
  }
}


