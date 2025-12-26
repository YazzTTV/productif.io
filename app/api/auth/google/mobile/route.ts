import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createToken, createSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { accessToken, idToken, email, name: providedName } = await req.json()

    if (!accessToken || !email) {
      return NextResponse.json(
        { error: "Tokens manquants" },
        { status: 400 }
      )
    }

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
    console.error("Erreur lors de l'authentification Google mobile:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

