import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

/**
 * POST /api/google-calendar/connect-mobile
 * 
 * Endpoint pour connecter Google Calendar depuis l'app mobile.
 * Reçoit le serverAuthCode obtenu via Google Sign-In natif avec le scope Calendar,
 * l'échange contre un access_token et refresh_token, et les stocke en base.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { serverAuthCode } = body

    if (!serverAuthCode) {
      return NextResponse.json(
        { error: "serverAuthCode requis" },
        { status: 400 }
      )
    }

    console.log(`🔗 [GOOGLE_CALENDAR_MOBILE] Connexion pour user ${user.id}`)

    // Échanger le serverAuthCode contre des tokens
    // Note: Pour mobile, on n'a pas besoin de redirect_uri ou on utilise une valeur spéciale
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: serverAuthCode,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        // Pour les apps mobiles, utiliser 'postmessage' ou laisser vide
        redirect_uri: '',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('❌ [GOOGLE_CALENDAR_MOBILE] Erreur échange token:', errorData)
      
      // Essayer avec redirect_uri: 'postmessage' (utilisé par certaines configs)
      const retryResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: serverAuthCode,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: 'authorization_code',
        }),
      })

      if (!retryResponse.ok) {
        const retryError = await retryResponse.json().catch(() => ({}))
        console.error('❌ [GOOGLE_CALENDAR_MOBILE] Retry échoué:', retryError)
        return NextResponse.json(
          { error: "Impossible d'échanger le code d'autorisation", details: retryError },
          { status: 400 }
        )
      }

      const retryData = await retryResponse.json()
      return handleTokenSuccess(user.id, retryData)
    }

    const tokenData = await tokenResponse.json()
    return handleTokenSuccess(user.id, tokenData)

  } catch (error) {
    console.error("❌ [GOOGLE_CALENDAR_MOBILE] Erreur:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

async function handleTokenSuccess(userId: string, tokenData: any) {
  const { access_token, refresh_token, expires_in, scope } = tokenData

  // Calculer la date d'expiration
  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + (expires_in || 3600))

  // Stocker ou mettre à jour le token dans la base de données
  await prisma.googleCalendarToken.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresAt,
      scope: scope || 'https://www.googleapis.com/auth/calendar',
    },
    update: {
      accessToken: access_token,
      refreshToken: refresh_token || undefined,
      expiresAt,
      scope: scope || 'https://www.googleapis.com/auth/calendar',
    },
  })

  console.log(`✅ [GOOGLE_CALENDAR_MOBILE] Token sauvegardé pour user ${userId}`)

  return NextResponse.json({
    success: true,
    message: "Google Calendar connecté avec succès",
    expiresAt: expiresAt.toISOString(),
  })
}

/**
 * GET /api/google-calendar/connect-mobile
 * 
 * Vérifie si l'utilisateur a déjà connecté Google Calendar
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const token = await prisma.googleCalendarToken.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        expiresAt: true,
        scope: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!token) {
      return NextResponse.json({
        connected: false,
      })
    }

    const isExpired = new Date() > token.expiresAt

    return NextResponse.json({
      connected: true,
      isExpired,
      expiresAt: token.expiresAt.toISOString(),
      scope: token.scope,
    })

  } catch (error) {
    console.error("❌ [GOOGLE_CALENDAR_MOBILE] Erreur GET:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

