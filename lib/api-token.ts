import { randomBytes } from 'crypto'
import { prisma } from './prisma'
import { sign, verify } from './jwt'

export interface ApiTokenPayload {
  tokenId: string
  userId: string
  scopes: string[]
  iat?: number
  exp?: number
}

/**
 * Génère un nouveau token API pour un utilisateur
 */
export async function generateApiToken({
  name,
  userId,
  description,
  scopes,
  expiresAt
}: {
  name: string
  userId: string
  description?: string
  scopes: string[]
  expiresAt?: Date
}) {
  // Créer un identifiant unique pour le token
  const tokenId = randomBytes(16).toString('hex')
  
  // Créer le payload JWT
  const payload: Omit<ApiTokenPayload, 'iat' | 'exp'> = {
    tokenId,
    userId,
    scopes
  }
  
  // Signer le token avec JWT
  const token = await sign(payload, expiresAt ? { expirationTime: expiresAt } : undefined)
  
  // Enregistrer le token dans la base de données
  const apiToken = await prisma.apiToken.create({
    data: {
      id: tokenId,
      name,
      token,
      userId,
      description,
      scopes,
      expiresAt
    }
  })
  
  return { token, apiToken }
}

/**
 * Vérifie et valide un token API
 */
export async function verifyApiToken(token: string): Promise<ApiTokenPayload | null> {
  try {
    // Vérifier la signature JWT
    const payload = await verify(token)
    if (!payload || !payload.tokenId) {
      return null
    }
    
    // Vérifier si le token existe dans la base de données
    const apiToken = await prisma.apiToken.findUnique({
      where: { token }
    })
    
    if (!apiToken) {
      return null
    }
    
    // Mettre à jour la date de dernière utilisation
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() }
    })
    
    return payload as ApiTokenPayload
  } catch (error) {
    console.error('API token verification error:', error)
    return null
  }
}

/**
 * Vérifie si un token a les scopes requis
 */
export function hasRequiredScopes(tokenScopes: string[], requiredScopes: string[]): boolean {
  return requiredScopes.every(scope => tokenScopes.includes(scope))
}

/**
 * Révoque un token API
 */
export async function revokeApiToken(tokenId: string): Promise<boolean> {
  try {
    await prisma.apiToken.delete({
      where: { id: tokenId }
    })
    return true
  } catch (error) {
    console.error('Error revoking API token:', error)
    return false
  }
} 