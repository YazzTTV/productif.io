import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verify } from "jsonwebtoken"

// Définir les routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register"]

export function middleware(request: NextRequest) {
  try {
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
      // Vérifier le token
      verify(token, process.env.JWT_SECRET || "fallback_secret")
      
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

