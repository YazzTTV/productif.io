import { NextRequest, NextResponse } from 'next/server'
import { verifyApiToken, hasRequiredScopes } from '@/lib/api-token'

export interface ApiAuthOptions {
  requiredScopes?: string[]
}

/**
 * Middleware d'authentification API pour protéger les routes API
 */
export async function apiAuth(
  req: NextRequest,
  options: ApiAuthOptions = {}
): Promise<NextResponse | null> {
  // Extraire le token d'autorisation de l'en-tête
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Un token API est requis' },
      { status: 401 }
    )
  }

  // Extraire le token
  const token = authHeader.substring(7)
  if (!token) {
    return NextResponse.json(
      { error: 'Un token API est requis' },
      { status: 401 }
    )
  }

  // Vérifier le token API
  const decoded = await verifyApiToken(token)
  if (!decoded) {
    return NextResponse.json(
      { error: 'Token API invalide ou expiré' },
      { status: 401 }
    )
  }

  // Vérifier les scopes (si requis)
  if (options.requiredScopes && options.requiredScopes.length > 0) {
    if (!hasRequiredScopes(decoded.scopes, options.requiredScopes)) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes', requiredScopes: options.requiredScopes },
        { status: 403 }
      )
    }
  }

  // Ajouter les informations du token au contexte de la requête
  req.headers.set('x-api-token-id', decoded.tokenId)
  req.headers.set('x-api-user-id', decoded.userId)
  
  // Token valide, continuer
  return null
} 