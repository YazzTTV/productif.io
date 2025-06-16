import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "un_secret_tres_securise_pour_jwt_tokens"

export async function getUserFromRequest(req: NextRequest) {
  try {
    // Récupérer le token de l'en-tête Authorization ou des cookies
    const authHeader = req.headers.get("Authorization")
    let token: string | undefined
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      // Récupérer le token des cookies
      const cookieStore = await cookies()
      token = cookieStore.get("auth_token")?.value
    }

    if (!token) {
      return null
    }

    // Vérifier et décoder le token
    const decoded = verify(token, JWT_SECRET)
    return decoded as { id: string; email: string; role: string }
  } catch (error) {
    console.error("Erreur lors de la vérification du token:", error)
    return null
  }
} 