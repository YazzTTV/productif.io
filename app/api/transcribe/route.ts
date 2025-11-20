import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { verifyApiToken } from '@/lib/api-token'
import { VoiceTranscriptionService } from '@/src/services/ai/VoiceTranscriptionService'
import * as fs from 'fs'
import * as path from 'path'
import { tmpdir } from 'os'

// Augmenter le timeout pour Vercel (max 60 secondes pour Pro)
export const maxDuration = 60

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

    // Convertir le File en Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Sauvegarder temporairement le fichier
    // Sur Vercel, utiliser /tmp qui est le seul dossier accessible en écriture
    const tempDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const tempFilePath = path.join(tempDir, `audio_${userId}_${Date.now()}.${audioFile.name.split('.').pop() || 'm4a'}`)
    fs.writeFileSync(tempFilePath, buffer)

    try {
      // Utiliser VoiceTranscriptionService comme pour WhatsApp
      const voiceService = new VoiceTranscriptionService()
      const result = await voiceService.transcribeAudio(tempFilePath)

      if (!result.success || !result.text) {
        return NextResponse.json(
          { 
            error: 'Erreur lors de la transcription',
            details: result.error || 'Transcription échouée'
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        transcription: result.text,
        success: true
      })
    } finally {
      // Nettoyer le fichier temporaire
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath)
        }
      } catch (cleanupError) {
        console.error('Erreur lors du nettoyage du fichier temporaire:', cleanupError)
      }
    }

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

