import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { prisma } from "./prisma"
import { sign, verify } from "./jwt"

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token)
    return payload as JWTPayload
  } catch (error) {
    console.error("Error verifying token:", error)
    return null
  }
}

export async function createToken(payload: Omit<JWTPayload, "iat" | "exp">) {
  return await sign(payload)
}

export async function getAuthUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      console.log("No token found in cookies")
      return null
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      console.log("Invalid token or no userId in token")
      return null
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      console.log("User not found in database, removing auth cookie")
      // Supprimer le cookie d'authentification si l'utilisateur n'existe pas
      cookieStore.delete("auth_token")
      return null
    }

    // Les nouveaux champs comme role ne seront disponibles qu'après 
    // la régénération du client Prisma, donc nous devons être prudents ici
    return user
  } catch (error) {
    console.error("Error in getAuthUser:", error)
    return null
  }
}

// Nouvelle fonction pour l'authentification mobile (avec header Authorization)
export async function getAuthUserFromRequest(req: NextRequest) {
  try {
    let token: string | null = null

    // 1. Essayer de récupérer le token depuis le header Authorization (mobile)
    const authHeader = req.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7) // Enlever "Bearer "
      console.log("Token found in Authorization header")
    }

    // 2. Si pas de token dans le header, essayer les cookies (web)
    if (!token) {
      token = req.cookies.get("auth_token")?.value
      if (token) {
        console.log("Token found in cookies")
      }
    }

    if (!token) {
      console.log("No token found in header or cookies")
      return null
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      console.log("Invalid token or no userId in token")
      return null
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      console.log("User not found in database")
      return null
    }

    return user
  } catch (error) {
    console.error("Error in getAuthUserFromRequest:", error)
    return null
  }
}

export async function createSession(userId: string, token: string) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Supprimer les anciennes sessions
  await prisma.session.deleteMany({
    where: { userId }
  })

  // Créer une nouvelle session
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  })
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({
    where: { token }
  })
}

export function setAuthCookie(response: Response, token: string) {
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: false, // Désactivé en développement
    sameSite: "lax",
    path: "/", // Important pour que le cookie soit disponible sur tout le site
    maxAge: 60 * 60 * 24 * 7 // 7 jours
  })
}

export function removeAuthCookie(response: Response) {
  response.cookies.delete("auth_token", {
    path: "/" // Important pour supprimer le cookie sur tout le site
  })
} 