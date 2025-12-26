import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { TrialService } from "@/lib/trial/TrialService"

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // base64url → base64
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64)
    return JSON.parse(json)
  } catch {
    return null
  }
}

// Définir les routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  "/login",
  "/register",
  "/onboarding",
  "/auth/callback", // Callback pour synchroniser NextAuth avec le système d'auth personnalisé
  "/upgrade",
  "/api/auth",
  "/api/auth/login",
  "/api/auth/register",
  "/api/webhooks/stripe",
  "/merci",
  "/pricing",
  "/tarifs",
  "/tarification",
  "/fonctionnalites",
  "/cgv",
  "/legal",
  "/privacy-policy",
  "/terms",
  "/refund-policy",
  // Landing marketing publique
  "/landing",
]

export async function middleware(request: NextRequest) {
  try {
    // Autoriser la home page explicitement
    if (request.nextUrl.pathname === "/") {
      return NextResponse.next()
    }

    // Autoriser les requêtes API munies d'un header Authorization Bearer (flows machine-to-machine)
    if (request.nextUrl.pathname.startsWith("/api/")) {
      const authHeader = request.headers.get("authorization") || ""
      if (authHeader.toLowerCase().startsWith("bearer ")) {
        return NextResponse.next()
      }
    }

    // Laisser passer les ressources statiques (fichiers du dossier public: /file.ext)
    // Heuristique: si le chemin contient un point, on considère que c'est un fichier
    if (request.nextUrl.pathname.includes('.') && !request.nextUrl.pathname.endsWith('.html')) {
      return NextResponse.next()
    }

    // Vérifier si la route est publique
    if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Récupérer le token depuis les cookies
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      console.log("No auth token found, redirecting to login")
      // Rediriger vers la page de login si pas de token
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      // Décoder le token (Edge runtime, sans vérification crypto)
      const payload = decodeJwtPayload(token) as { userId?: string } | null
      if (!payload?.userId) {
        throw new Error("invalid token payload")
      }
      
      // Ne plus vérifier le trial côté middleware (Edge runtime). La gestion se fait côté client/API.
      // On laisse passer le dashboard, l'overlay client gère le blocage UI.
      
      // Ajouter l'en-tête X-Auth-Token pour les requêtes API
      if (request.nextUrl.pathname.startsWith("/api/")) {
        const response = NextResponse.next()
        response.headers.set("X-Auth-Token", token)
        return response
      }
      
      return NextResponse.next()
    } catch (error) {
      console.error("Invalid token:", error)
      // Supprimer les cookies d'authentification
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("auth_token")
      response.cookies.delete("auth_status")
      return response
    }
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

// Configurer les chemins qui doivent passer par le middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. _next/static (static files)
     * 2. _next/image (image optimization files)
     * 3. favicon.ico (favicon file)
     * 4. public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}

