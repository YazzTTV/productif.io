import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'
import { v4 as uuidv4 } from 'uuid'
import { TextEncoder } from 'util'

// Secret pour signer les tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || "un_secret_tres_securise_pour_jwt_tokens"

// Liste de toutes les permissions disponibles
const ALL_PERMISSIONS = [
  'tasks:read',
  'tasks:write',
  'habits:read',
  'habits:write',
  'projects:read',
  'projects:write',
  'objectives:read',
  'objectives:write',
  'processes:read',
  'processes:write'
]

// Liste tous les tokens API de l'utilisateur authentifié
export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const tokens = await prisma.apiToken.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        scopes: true,
        lastUsed: true,
        expiresAt: true,
        createdAt: true,
        token: false,
        userId: false,
        updatedAt: false,
        user: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

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
    const { name } = await req.json()

    // Validation
    if (!name) {
      return NextResponse.json({ error: 'Un nom est requis' }, { status: 400 })
    }

    // Générer un ID unique pour le token
    const tokenId = uuidv4()

    // Créer le payload JWT
    const payload = {
      tokenId,
      userId: user.id,
      scopes: ALL_PERMISSIONS
    }

    // Signer le token avec jose
    const secretBytes = new TextEncoder().encode(JWT_SECRET)
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(secretBytes)

    // Créer le token avec toutes les permissions
    const apiToken = await prisma.apiToken.create({
      data: {
        id: tokenId,
        token,
        name,
        userId: user.id,
        scopes: ALL_PERMISSIONS
      }
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
      token: apiToken.token
    })
  } catch (error) {
    console.error('Erreur lors de la création du token API:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du token API' },
      { status: 500 }
    )
  }
} 