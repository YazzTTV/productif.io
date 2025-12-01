import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest, getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST : nettoyer l'état conversationnel en attente
export async function POST(req: NextRequest) {
  try {
    // Authentification
    let user = await getAuthUserFromRequest(req)
    if (!user) {
      user = await getAuthUser()
    }
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Supprimer l'état conversationnel
    await prisma.userConversationState.deleteMany({
      where: { userId: user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing conversation state:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


