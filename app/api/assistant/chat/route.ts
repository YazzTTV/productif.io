import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { verifyApiToken } from '@/lib/api-token'
import { AIService } from '@/src/services/ai/AIService'
import { prisma } from '@/lib/prisma'

const aiService = new AIService()

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

    const body = await req.json().catch(() => ({})) as { message?: string }
    
    if (!body?.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    // Récupérer l'utilisateur avec ses relations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tasks: {
          where: {
            completed: false,
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        habits: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Pour l'app mobile, on utilise l'ID utilisateur comme identifiant
    // Si l'utilisateur n'a pas de numéro WhatsApp, on lui en assigne un temporaire basé sur son ID
    // pour que l'AIService puisse le trouver
    let phoneNumber = user.whatsappNumber
    if (!phoneNumber) {
      phoneNumber = `mobile_${userId}`
      // Mettre à jour l'utilisateur avec cet identifiant pour que l'AIService puisse le trouver
      await prisma.user.update({
        where: { id: userId },
        data: { whatsappNumber: phoneNumber }
      })
    }

    // Traiter le message avec l'agent IA
    const aiResponse = await aiService.processMessage(phoneNumber, body.message)
    
    return NextResponse.json({
      response: aiResponse.response,
      contextual: aiResponse.contextual || false,
      success: true
    })

  } catch (error: any) {
    console.error('Erreur lors du traitement du message:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors du traitement du message',
        details: error?.message || 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

