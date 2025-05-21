import { NextRequest, NextResponse } from 'next/server'
import { apiAuth } from '@/middleware/api-auth'

export async function GET(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['tasks:read'] // Un scope de test
  })
  
  // Si l'authentification a échoué, retourner la réponse d'erreur
  if (authResponse) {
    return authResponse
  }
  
  // Extraire l'ID de l'utilisateur à partir de l'en-tête (ajouté par le middleware)
  const userId = req.headers.get('x-api-user-id')
  const tokenId = req.headers.get('x-api-token-id')
  
  return NextResponse.json({
    success: true,
    message: 'Votre token API fonctionne correctement',
    userId,
    tokenId,
    timestamp: new Date().toISOString()
  })
} 