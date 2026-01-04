import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createToken, createSession } from "@/lib/auth"
import { createRemoteJWKSet, jwtVerify } from "jose"

const appleJWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"))

// Bundle ID de l'app iOS (utilisé comme audience pour vérifier le token)
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || "io.productif.app"

export async function POST(req: NextRequest) {
  try {
    // Récupérer l'identityToken depuis le header Authorization ou le body
    const authHeader = req.headers.get("authorization")
    let identityToken: string | null = null
    let email: string | undefined
    let name: string | undefined

    if (authHeader && authHeader.startsWith("Bearer ")) {
      identityToken = authHeader.substring(7)
    }

    // Si pas d'identityToken dans le header, lire le body (compatibilité avec l'ancienne méthode)
    if (!identityToken) {
      try {
        const body = await req.json()
        identityToken = body.identityToken
        email = body.email
        name = body.name
      } catch (error) {
        // Body vide ou invalide
      }
    }

    if (!identityToken) {
      return NextResponse.json(
        { error: "identityToken manquant. Envoyez-le dans le header Authorization: Bearer <identityToken> ou dans le body" },
        { status: 400 }
      )
    }

    // Vérifier l'identityToken avec Apple
    let payload: any
    try {
      const { payload: verifiedPayload } = await jwtVerify(identityToken, appleJWKS, {
        issuer: "https://appleid.apple.com",
        audience: APPLE_CLIENT_ID,
      })
      payload = verifiedPayload
      
      console.log("✅ [AppleAuth] Token vérifié avec succès")
      console.log("✅ [AppleAuth] Subject (sub):", payload.sub)
      console.log("✅ [AppleAuth] Email:", payload.email || email)
    } catch (error: any) {
      console.error("❌ Erreur de vérification de l'identityToken Apple:", error)
      return NextResponse.json(
        { error: "identityToken Apple invalide", details: error.message },
        { status: 401 }
      )
    }

    // Extraire les informations utilisateur
    // Note: email et name ne sont fournis qu'au premier login
    // Ensuite, seul le 'sub' (subject) est disponible dans le token
    const appleUserId = payload.sub as string
    const userEmail = (payload.email as string) || email || null
    const userName = name || (payload.email ? payload.email.split("@")[0] : "Utilisateur Apple")

    if (!userEmail) {
      // Si pas d'email dans le token et pas fourni, on doit chercher l'utilisateur par Apple ID
      // Chercher l'utilisateur par Apple ID (sub) si on a un champ pour ça
      // Pour l'instant, on retourne une erreur car on a besoin de l'email
      // TODO: Stocker appleUserId (sub) dans la DB pour pouvoir retrouver l'utilisateur même sans email
      return NextResponse.json(
        { error: "Email manquant. L'email n'est fourni qu'au premier login avec Apple. Veuillez vous connecter à nouveau." },
        { status: 400 }
      )
    }

    // Note: L'email peut être un email privé Apple (relay) du format: abc123@privaterelay.appleid.com
    // C'est normal et Apple gère la redirection vers le vrai email

    // Vérifier si l'utilisateur existe déjà (par email)
    let user = await prisma.user.findUnique({
      where: { email: userEmail.toLowerCase() },
    })

    // Si l'utilisateur n'existe pas, le créer
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail.toLowerCase(),
          name: userName,
          password: "", // Pas de mot de passe pour les utilisateurs Apple
          // TODO: Stocker aussi appleUserId (sub) dans un champ dédié pour pouvoir retrouver l'utilisateur même si l'email change
        },
      })
    } else {
      // Mettre à jour le nom si fourni (seulement au premier login)
      if (name && user.name !== name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name },
        })
      }
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
    console.error("Erreur lors de l'authentification Apple:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

