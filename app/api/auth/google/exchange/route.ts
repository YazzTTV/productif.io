import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

/**
 * Échange le code d'autorisation contre un access token
 * Ce endpoint est nécessaire car le client secret ne peut pas être exposé côté mobile
 */
export async function POST(req: NextRequest) {
  try {
    const { code, redirectUri } = await req.json()

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: "Code et redirectUri sont requis" },
        { status: 400 }
      )
    }

    // Échanger le code contre un access token
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      return NextResponse.json(
        { error: "Impossible d'obtenir l'access token" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      accessToken: tokens.access_token,
      idToken: tokens.id_token || null,
      refreshToken: tokens.refresh_token || null,
      expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : null,
    })
  } catch (error: any) {
    console.error("Erreur lors de l'échange du code Google:", error)
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'échange du code" },
      { status: 500 }
    )
  }
}

