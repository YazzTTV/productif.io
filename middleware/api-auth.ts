import { NextRequest, NextResponse } from 'next/server'
import { verifyApiToken, hasRequiredScopes, ApiTokenPayload } from '@/lib/api-token'
import { TrialService } from '@/lib/trial/TrialService'

export interface ApiAuthOptions {
  requiredScopes?: string[]
  checkTrial?: boolean // Activer la vérification du trial
}

export interface VerifyApiTokenResult {
  valid: boolean
  error?: string
  payload?: ApiTokenPayload
}

/**
 * Helper pour vérifier un token API depuis une requête Next.js
 * Utilisé par les routes API qui ont besoin d'une vérification simple
 */
export async function verifyApiTokenFromRequest(
  req: NextRequest,
  requiredScopes?: string[]
): Promise<VerifyApiTokenResult> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Un token API est requis' }
  }

  const token = authHeader.substring(7)
  if (!token) {
    return { valid: false, error: 'Un token API est requis' }
  }

  const payload = await verifyApiToken(token)
  if (!payload) {
    return { valid: false, error: 'Token API invalide ou expiré' }
  }

  if (requiredScopes && requiredScopes.length > 0) {
    if (!hasRequiredScopes(payload.scopes, requiredScopes)) {
      return { 
        valid: false, 
        error: 'Permissions insuffisantes',
        payload 
      }
    }
  }

  return { valid: true, payload }
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

  // Vérifier le trial (si activé)
  if (options.checkTrial !== false) { // Par défaut, vérifier le trial
    const accessCheck = await TrialService.hasAccess(decoded.userId)
    
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { 
          error: accessCheck.reason || 'Accès expiré. Abonnez-vous pour continuer.',
          status: accessCheck.status,
          upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`
        },
        { status: 403 }
      )
    }
    
    // Ajouter les infos de trial dans les headers
    req.headers.set('x-trial-status', accessCheck.status)
    if (accessCheck.trialDaysLeft !== undefined) {
      req.headers.set('x-trial-days-left', accessCheck.trialDaysLeft.toString())
    }
  }

  // Ajouter les informations du token au contexte de la requête
  req.headers.set('x-api-token-id', decoded.tokenId)
  req.headers.set('x-api-user-id', decoded.userId)
  
  // Token valide, continuer
  return null
} 