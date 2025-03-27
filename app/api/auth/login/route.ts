import { NextResponse } from "next/server"
import { compare } from "bcrypt"
import { prisma } from "@/lib/prisma"
import { createToken, createSession } from "@/lib/auth"

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
    const response = new NextResponse(
      JSON.stringify({
        success: true,
        user: userWithoutPassword,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    // Définir le cookie avec les bonnes options pour l'environnement de production
    const isProduction = process.env.NODE_ENV === "production"
    
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: isProduction, // Sécurisé en production
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    })

    // Ajouter un second cookie non-httpOnly pour vérification côté client
    response.cookies.set("auth_status", "logged_in", {
      httpOnly: false, 
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    })

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

