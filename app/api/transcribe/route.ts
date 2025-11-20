import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { verifyApiToken } from '@/lib/api-token'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
    
    let userId: string | null = null
    
    // Essayer d'abord avec un token utilisateur (JWT) - pour l'app mobile
    if (token) {
      const user = await getAuthUserFromRequest(req)
      if (user) {
        userId = user.id
      }
    }
    
    // Si pas d'utilisateur, essayer avec un token API
    if (!userId && token) {
      try {
        const payload = await verifyApiToken(token)
        if (payload) {
          userId = payload.userId
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du token API:', error)
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 })
    }

    // Vérifier que OPENAI_API_KEY est configuré
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Service de transcription non configuré' }, { status: 500 })
    }

    // Récupérer le fichier audio depuis FormData
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'Fichier audio requis' }, { status: 400 })
    }

    // Convertir le File en Buffer puis créer un File pour OpenAI
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Créer un File object pour OpenAI Whisper
    // OpenAI accepte un File avec un stream ou un buffer
    const audioFileForOpenAI = new File(
      [buffer],
      `audio-${Date.now()}.${audioFile.name.split('.').pop() || 'm4a'}`,
      { type: audioFile.type || 'audio/m4a' }
    )

    // Transcrire avec OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFileForOpenAI,
      model: 'whisper-1',
      language: 'fr', // Français par défaut
      response_format: 'text'
    })

    const transcriptionText = typeof transcription === 'string' ? transcription : transcription.text || ''

    return NextResponse.json({
      transcription: transcriptionText.trim(),
      success: true
    })

  } catch (error: any) {
    console.error('Erreur lors de la transcription:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la transcription',
        details: error?.message || 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

