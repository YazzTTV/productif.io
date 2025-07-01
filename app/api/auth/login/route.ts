import { NextResponse } from "next/server"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createToken, createSession } from "@/lib/auth"
import { getCookieConfig, getClientCookieConfig } from "@/lib/cookie-config"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // Validation simple
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Vérifier si l'utilisateur existe
    if (!user) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 })
    }

    // Vérifier le mot de passe
    const passwordMatch = await compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 })
    }

    // Créer un token JWT
    const token = await createToken({
      userId: user.id,
      email: user.email,
    })

    // Créer une session
    await createSession(user.id, token)

    // Ne pas renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = user

    // Créer la réponse
    const response = NextResponse.json(
      {
        success: true,
        user: userWithoutPassword,
      },
      {
        status: 200,
      }
    )

    // Obtenir les configurations des cookies
    const cookieConfig = getCookieConfig(req)
    const clientCookieConfig = getClientCookieConfig(req)

    // Définir les cookies avec les nouvelles configurations
    response.cookies.set("auth_token", token, cookieConfig)
    response.cookies.set("auth_status", "logged_in", clientCookieConfig)

    console.log("Login successful, token set:", token)
    return response

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la connexion" },
      { status: 500 }
    )
  }
}

