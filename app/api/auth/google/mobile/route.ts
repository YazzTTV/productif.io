import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createToken, createSession } from "@/lib/auth"
import { OAuth2Client } from "google-auth-library"

// Client IDs acceptés pour la vérification de l'idToken
// IMPORTANT: L'idToken mobile doit avoir comme audience le WEB_CLIENT_ID (pas l'iOS Client ID)
// Le WEB_CLIENT_ID doit être dans le même projet Google Cloud que l'iOS Client ID
const GOOGLE_CLIENT_ID_WEB = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_ID_IOS = process.env.GOOGLE_MOBILE_CLIENT_ID_IOS || "738789952398-m6risp9hae6ao11n7s4178nig64largu.apps.googleusercontent.com"

// Liste de tous les audiences valides
// L'idToken mobile doit avoir comme audience le WEB_CLIENT_ID
// On accepte aussi l'iOS Client ID temporairement pour compatibilité, mais le WEB_CLIENT_ID est prioritaire
const VALID_AUDIENCES = [GOOGLE_CLIENT_ID_WEB, GOOGLE_CLIENT_ID_IOS].filter(Boolean)

// Vérifier que les deux IDs sont dans le même projet (sécurité)
const webProjectId = GOOGLE_CLIENT_ID_WEB.split('-')[0]
const iosProjectId = GOOGLE_CLIENT_ID_IOS.split('-')[0]
if (webProjectId !== iosProjectId) {
  console.warn(`⚠️ [GoogleAuth] Les Client IDs ne sont pas dans le même projet! Web: ${webProjectId}, iOS: ${iosProjectId}`)
  console.warn(`⚠️ [GoogleAuth] Créez un Web Client ID dans le projet iOS (${iosProjectId})`)
}

export async function POST(req: NextRequest) {
  try {
    // Récupérer l'idToken depuis le header Authorization (méthode recommandée par Google)
    const authHeader = req.headers.get("authorization")
    let idToken: string | null = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      idToken = authHeader.substring(7)
    }

    // Si pas d'idToken dans le header, lire le body pour compatibilité
    let body: any = {}
    if (!idToken) {
      try {
        body = await req.json()
        const { accessToken, idToken: bodyIdToken, email, name: providedName } = body
        
        // Si on a l'ancienne méthode avec accessToken, on la gère
        if (accessToken && email) {
          return handleLegacyAuth(accessToken, email, providedName)
        }
        
        if (bodyIdToken) {
          idToken = bodyIdToken
        }
      } catch (error) {
        // Body vide ou invalide, continuer avec idToken du header
      }
    }

    if (!idToken) {
      return NextResponse.json(
        { error: "idToken manquant. Envoyez-le dans le header Authorization: Bearer <idToken>" },
        { status: 400 }
      )
    }

    // Vérifier l'idToken avec Google
    // IMPORTANT: L'idToken doit avoir comme audience le WEB_CLIENT_ID (pas l'iOS Client ID)
    const client = new OAuth2Client()
    let ticket
    try {
      // D'abord, décoder le token pour voir l'audience (sans vérification)
      const tokenParts = idToken.split('.')
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
        console.log("🔍 [GoogleAuth] Token audience (aud):", payload.aud)
        console.log("🔍 [GoogleAuth] Token issuer (iss):", payload.iss)
        console.log("🔍 [GoogleAuth] Audiences acceptées:", VALID_AUDIENCES)
      }
      
      // Vérifier le token avec Google
      ticket = await client.verifyIdToken({
        idToken,
        audience: VALID_AUDIENCES, // Accepter Web Client ID et iOS Client ID (temporaire)
      })
      
      const payload = ticket.getPayload()
      if (payload) {
        console.log("✅ [GoogleAuth] Token vérifié avec succès")
        console.log("✅ [GoogleAuth] Audience validée:", payload.aud)
      }
    } catch (error: any) {
      console.error("❌ Erreur de vérification de l'idToken Google:", error)
      console.error("❌ Audiences valides:", VALID_AUDIENCES)
      
      // Message d'erreur plus détaillé
      if (error.message?.includes('audience')) {
        return NextResponse.json(
          { 
            error: "idToken Google invalide: l'audience ne correspond pas. Vérifiez que le Web Client ID est dans le même projet que l'iOS Client ID.",
            details: `Audiences acceptées: ${VALID_AUDIENCES.join(', ')}`
          },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: "idToken Google invalide", details: error.message },
        { status: 401 }
      )
    }

    const payload = ticket.getPayload()
    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: "Impossible de récupérer les informations utilisateur depuis l'idToken" },
        { status: 401 }
      )
    }

    const email = payload.email.toLowerCase()
    const userName = payload.name || "Utilisateur Google"

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { email },
    })

    // Si l'utilisateur n'existe pas, le créer
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: userName,
          password: "", // Pas de mot de passe pour les utilisateurs Google
        },
      })
    }

    // Créer un token JWT avec le système d'auth personnalisé
    const token = await createToken({
      userId: user.id,
      email: user.email,
    })

    // Créer une session dans la base de données
    await createSession(user.id, token)

    // Ne pas renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error("Erreur lors de l'authentification Google mobile:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// Fonction pour gérer l'ancienne méthode (compatibilité)
async function handleLegacyAuth(accessToken: string, email: string, providedName?: string) {
  try {
    // Vérifier le token avec Google en récupérant les infos utilisateur
    let userName = providedName
    try {
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      )

      if (!userInfoResponse.ok) {
        return NextResponse.json(
          { error: "Token Google invalide" },
          { status: 401 }
        )
      }

      const userInfo = await userInfoResponse.json()

      // Vérifier que l'email correspond
      if (userInfo.email !== email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email ne correspond pas au token" },
          { status: 401 }
        )
      }

      // Utiliser le nom de Google si disponible
      if (!userName && userInfo.name) {
        userName = userInfo.name
      }
    } catch (error) {
      console.error("Erreur de vérification du token Google:", error)
      return NextResponse.json(
        { error: "Token Google invalide" },
        { status: 401 }
      )
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Si l'utilisateur n'existe pas, le créer
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: userName || "Utilisateur Google",
          password: "", // Pas de mot de passe pour les utilisateurs Google
        },
      })
    }

    // Créer un token JWT avec le système d'auth personnalisé
    const token = await createToken({
      userId: user.id,
      email: user.email,
    })

    // Créer une session dans la base de données
    await createSession(user.id, token)

    // Ne pas renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error("Erreur lors de l'authentification Google mobile (legacy):", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

