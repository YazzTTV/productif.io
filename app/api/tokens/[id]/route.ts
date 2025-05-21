import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revokeApiToken } from '@/lib/api-token'

// Supprime un token API
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = params
  
  try {
    // Vérifier que le token appartient à l'utilisateur
    const token = await prisma.$queryRaw`
      SELECT id 
      FROM api_tokens 
      WHERE id = ${id} AND "userId" = ${user.id}
    `
    
    // Si le token n'existe pas ou n'appartient pas à l'utilisateur
    if (!token || (Array.isArray(token) && token.length === 0)) {
      return NextResponse.json({ error: 'Token non trouvé' }, { status: 404 })
    }
    
    // Révoquer le token
    const success = await revokeApiToken(id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du token' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression du token API:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du token API' },
      { status: 500 }
    )
  }
} 