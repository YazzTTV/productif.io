import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verify } from "jsonwebtoken"

// Routes qui ne nécessitent pas d'authentification
const publicRoutes = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifier si la route est publique
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Récupérer le token depuis les cookies
  const token = request.cookies.get("auth_token")?.value

  // Si pas de token, rediriger vers la page de connexion
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = `?redirect=${pathname}`
    return NextResponse.redirect(url)
  }

  try {
    // Vérifier le token
    verify(token, process.env.JWT_SECRET || "fallback_secret")
    return NextResponse.next()
  } catch (error) {
    // Token invalide, rediriger vers la page de connexion
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }
}

// Configurer les chemins sur lesquels le middleware s'applique
export const config = {
  matcher: [
    // Appliquer à toutes les routes sauf les fichiers statiques
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

