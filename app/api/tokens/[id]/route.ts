import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Supprime un token API
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    // Vérifier que le token appartient à l'utilisateur
    const token = await prisma.apiToken.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!token) {
      return NextResponse.json({ error: 'Token non trouvé' }, { status: 404 })
    }

    // Supprimer le token
    await prisma.apiToken.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression du token:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du token' },
      { status: 500 }
    )
  }
} 