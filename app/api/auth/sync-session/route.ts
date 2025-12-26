import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createToken, createSession } from "@/lib/auth"
import { getCookieConfig, getClientCookieConfig } from "@/lib/cookie-config"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    // Récupérer la session NextAuth
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Pas de session NextAuth" },
        { status: 401 }
      )
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Créer un token JWT avec le système d'auth personnalisé
    const token = await createToken({
      userId: user.id,
      email: user.email,
    })

    // Créer une session dans la base de données
    await createSession(user.id, token)

    // Obtenir les configurations des cookies
    const cookieConfig = getCookieConfig(req)
    const clientCookieConfig = getClientCookieConfig(req)

    // Créer la réponse
    const response = NextResponse.json({ success: true })

    // Définir les cookies avec les nouvelles configurations
    response.cookies.set("auth_token", token, cookieConfig)
    response.cookies.set("auth_status", "logged_in", clientCookieConfig)

    return response
  } catch (error) {
    console.error("Erreur lors de la synchronisation de session:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

