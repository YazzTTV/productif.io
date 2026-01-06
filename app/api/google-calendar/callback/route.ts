import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // L'ID utilisateur
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=${encodeURIComponent(error)}`, NEXTAUTH_URL)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=missing_params', NEXTAUTH_URL)
      )
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: state },
    })

    if (!user) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=user_not_found', NEXTAUTH_URL)
      )
    }

    // Échanger le code contre un access token
    const redirectUri = `${NEXTAUTH_URL}/api/google-calendar/callback`
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('Erreur lors de l\'échange du code:', errorData)
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=token_exchange_failed', NEXTAUTH_URL)
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in, scope } = tokenData

    // Calculer la date d'expiration
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (expires_in || 3600))

    // Stocker ou mettre à jour le token dans la base de données
    await prisma.googleCalendarToken.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
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

    // Rediriger vers les paramètres avec un message de succès
    return NextResponse.redirect(
      new URL('/dashboard/settings?success=google_calendar_connected', NEXTAUTH_URL)
    )
  } catch (error) {
    console.error("Erreur lors du callback Google Calendar:", error)
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=callback_error', NEXTAUTH_URL)
    )
  }
}







