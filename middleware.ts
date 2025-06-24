import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verify } from "jsonwebtoken"

// Définir les routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register"]

export function middleware(request: NextRequest) {
  // Vérifier si la route est publique
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Récupérer le token depuis les cookies
  const token = request.cookies.get("auth_token")?.value

  if (!token) {
    // Rediriger vers la page de login si pas de token
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    // Vérifier le token
    verify(token, process.env.JWT_SECRET || "fallback_secret")
    return NextResponse.next()
  } catch (error) {
    // Rediriger vers la page de login si le token est invalide
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

