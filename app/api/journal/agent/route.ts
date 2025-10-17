import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiAuth } from '@/middleware/api-auth'
import { analyzeJournalEntry } from '@/lib/ai/journal-analysis'

// Normalise une date à minuit (00:00:00)
function normalizeToDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(req: NextRequest) {
  const authResponse = await apiAuth(req, { requiredScopes: ['journal:read'] })
  if (authResponse) return authResponse

  try {
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '7', 10)
    const userId = req.headers.get('x-api-user-id')!

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
  const authResponse = await apiAuth(req, { requiredScopes: ['journal:write'] })
  if (authResponse) return authResponse

  try {
    const userId = req.headers.get('x-api-user-id')!
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


