import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApiToken, revokeApiToken } from '@/lib/api-token'

// Liste tous les tokens API de l'utilisateur authentifié
export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    // Utiliser une requête SQL brute en attendant la migration Prisma
    const tokens = await prisma.$queryRaw`
      SELECT id, name, description, scopes, "lastUsed", "expiresAt", "createdAt"
      FROM api_tokens
      WHERE "userId" = ${user.id}
      ORDER BY "createdAt" DESC
    `

    return NextResponse.json(tokens)
  } catch (error) {
    console.error('Erreur lors de la récupération des tokens API:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des tokens API' }, { status: 500 })
  }
}

// Crée un nouveau token API
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { name, description, scopes, expiresAt } = await req.json()

    // Validation
    if (!name) {
      return NextResponse.json({ error: 'Un nom est requis' }, { status: 400 })
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json({ error: 'Des scopes valides sont requis' }, { status: 400 })
    }

    // Générer le token
    const { token, apiToken } = await generateApiToken({
      name,
      userId: user.id,
      description,
      scopes,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    })

    // Ne retourner le token complet qu'une seule fois lors de la création
    return NextResponse.json({
      id: apiToken.id,
      name: apiToken.name,
      description: apiToken.description,
      scopes: apiToken.scopes,
      lastUsed: apiToken.lastUsed,
      expiresAt: apiToken.expiresAt,
      createdAt: apiToken.createdAt,
      token
    })
  } catch (error) {
    console.error('Erreur lors de la création du token API:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du token API' },
      { status: 500 }
    )
  }
} 