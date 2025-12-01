import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest, getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const QUESTION_TEMPLATES = {
  mood: [
    '😊 Comment te sens-tu en ce moment ? (1-10)',
    '😊 Quelle est ton humeur actuellement ? (1-10)',
    '🌟 Comment évalues-tu ton humeur ? (1-10)'
  ],
  focus: [
    '🎯 Quel est ton niveau de concentration ? (1-10)',
    '🎯 Es-tu concentré en ce moment ? (1-10)',
    '🔍 Comment évalues-tu ta capacité de focus actuelle ? (1-10)'
  ],
  motivation: [
    '🔥 Quel est ton niveau de motivation ? (1-10)',
    '💪 Te sens-tu motivé(e) en ce moment ? (1-10)',
    '🚀 Comment est ta motivation aujourd\'hui ? (1-10)'
  ],
  energy: [
    '⚡ Quel est ton niveau d\'énergie ? (1-10)',
    '⚡ Comment te sens-tu niveau énergie ? (1-10)',
    '🔋 Évalue ton niveau d\'énergie actuel (1-10)'
  ],
  stress: [
    '😰 Quel est ton niveau de stress ? (1-10)',
    '😌 Te sens-tu stressé(e) ? (1-10)',
    '💆 Comment évalues-tu ton stress actuellement ? (1-10)'
  ]
}

// GET : vérifier s'il y a une question en attente pour cet utilisateur
export async function GET(req: NextRequest) {
  try {
    // Authentification
    let user = await getAuthUserFromRequest(req)
    if (!user) {
      user = await getAuthUser()
    }
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier s'il y a un état conversationnel en attente
    const conversationState = await prisma.userConversationState.findUnique({
      where: { userId: user.id }
    })

    if (conversationState && conversationState.state.startsWith('awaiting_checkin_')) {
      const type = conversationState.state.replace('awaiting_checkin_', '')
      const data = conversationState.data as any
      
      // Vérifier si c'est pour le web (pas WhatsApp)
      if (data?.platform === 'web') {
        // Récupérer la question correspondante
        const questions = QUESTION_TEMPLATES[type as keyof typeof QUESTION_TEMPLATES]
        if (questions && questions.length > 0) {
          // Prendre la première question ou une aléatoire
          const question = questions[0]
          
          return NextResponse.json({
            question,
            type,
            timestamp: data.timestamp
          })
        }
      }
    }

    return NextResponse.json({ question: null })
  } catch (error) {
    console.error('Error checking pending question:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


