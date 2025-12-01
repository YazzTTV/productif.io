import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { verifyApiToken } from '@/lib/api-token'
import { AIService } from '@/src/services/ai/AIService'
import { prisma } from '@/lib/prisma'
import { analyzeBehaviorPatterns } from '@/lib/ai/behavior-analysis.service'

const aiService = new AIService()

// Mise en forme générique des réponses de l'agent IA pour le chat web
function formatAgentResponse(text: string): string {
  if (!text) return text

  let formatted = text.replace(/\r\n/g, '\n').trim()

  // Ajouter des sauts de ligne avant certains en-têtes emoji courants
  formatted = formatted.replace(/(📊|📈|💡|🎯|📋)/g, '\n\n$1')

  // Éviter de multiplier les retours à la ligne
  formatted = formatted.replace(/\n{3,}/g, '\n\n')

  // S'assurer qu'une liste numérotée commence sur une nouvelle ligne
  formatted = formatted.replace(/(?<!\n)\s+([0-9]+\.\s)/g, '\n$1')

  return formatted.trim()
}

export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null

    // 1) Essayer d'abord via l'utilisateur authentifié (cookies ou header)
    const webUser = await getAuthUserFromRequest(req)
    if (webUser) {
      userId = webUser.id
    }

    // 2) Si pas d'utilisateur, essayer avec un token API explicite
    if (!userId) {
      const authHeader = req.headers.get('authorization') || ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''

      if (token) {
        try {
          const payload = await verifyApiToken(token)
          if (payload) {
            userId = payload.userId
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du token API:', error)
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { message?: string }

    if (!body?.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    const lowerMessage = body.message.toLowerCase().trim()

    // Cas spécial : commande d'analyse comportementale comme sur WhatsApp ("analyse", "rapport", "pattern", "comportement")
    if (
      lowerMessage.includes('analyse') ||
      lowerMessage.includes('rapport') ||
      lowerMessage.includes('pattern') ||
      lowerMessage.includes('comportement')
    ) {
      try {
        const days = 7
        const analysis = await analyzeBehaviorPatterns(userId, days)

        // Si pas assez de données, message simple
        if (!analysis || (analysis.insights?.length || 0) === 0) {
          return NextResponse.json({
            response:
              "📊 Continue à répondre aux questions quotidiennes (humeur, focus, énergie, etc.) pour recevoir ton analyse comportementale !",
            contextual: true,
            success: true
          })
        }

        const avg = analysis.averages

        // On formate avec des retours à la ligne. Le front se charge de les afficher (whitespace-pre-line).
        let message = `📊 **Ton analyse des 7 derniers jours**\n\n`
        
        // Moyennes
        message += `📈 **Moyennes:**\n\n`
        message += `😊 Humeur: ${avg.mood.toFixed(1)}/10\n`
        message += `🎯 Focus: ${avg.focus.toFixed(1)}/10\n`
        message += `🔥 Motivation: ${avg.motivation.toFixed(1)}/10\n`
        message += `⚡ Énergie: ${avg.energy.toFixed(1)}/10\n`
        message += `😰 Stress: ${avg.stress.toFixed(1)}/10\n\n`

        // Insights avec meilleur formatage
        if (analysis.insights.length > 0) {
          message += `💡 **Insights clés:**\n\n`
          analysis.insights.forEach((insight, idx) => {
            message += `${idx + 1}. ${insight}\n\n`
          })
        }

        // Recommandations avec meilleur formatage
        if (analysis.recommendations.length > 0) {
          message += `🎯 **Recommandations:**\n\n`
          analysis.recommendations.forEach((rec, idx) => {
            message += `${idx + 1}. ${rec}\n\n`
          })
        }

        return NextResponse.json({
          response: formatAgentResponse(message),
          contextual: true,
          success: true
        })
      } catch (error) {
        console.error('Erreur lors de la génération de l’analyse comportementale:', error)
        return NextResponse.json(
          {
            error: "Erreur lors de la génération de l'analyse comportementale"
          },
          { status: 500 }
        )
      }
    }

    // Récupérer l'utilisateur avec ses relations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tasks: {
          where: {
            completed: false
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

    // Identifiant conversationnel réutilisé par l'agent IA (WhatsApp ou web)
    let phoneNumber = user.whatsappNumber
    if (!phoneNumber) {
      phoneNumber = `web_${userId}`
      await prisma.user.update({
        where: { id: userId },
        data: { whatsappNumber: phoneNumber }
      })
    }

    // Traiter le message avec l'agent IA (même logique que WhatsApp)
    const aiResponse = await aiService.processMessage(phoneNumber, body.message)

    return NextResponse.json({
      response: formatAgentResponse(aiResponse.response),
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

