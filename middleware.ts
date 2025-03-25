import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

// Routes qui ne nécessitent pas d'authentification
const publicRoutes = ["/login", "/register", "/"]

export async function middleware(request: NextRequest) {
  // Récupérer le token depuis les cookies
  const token = request.cookies.get("auth_token")?.value
  const nextAuthSession = request.cookies.get("next-auth.session-token")?.value

  // Vérifier si l'utilisateur est sur une page publique
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)
  
  // Vérifier si c'est une route API d'authentification
  const isApiAuthRoute = request.nextUrl.pathname.startsWith("/api/auth")

  // Ne pas interférer avec les routes API d'authentification ou NextAuth
  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  // Vérifier si l'utilisateur est authentifié soit par notre système soit par NextAuth
  let isValidToken = false
  
  // Vérifier notre token personnalisé
  if (token) {
    try {
      const decoded = await verifyToken(token)
      isValidToken = decoded !== null
      console.log("Token verification result:", { isValidToken, decoded })
    } catch (error) {
      console.error("Token verification error:", error)
      isValidToken = false
    }
  }
  
  // Si NextAuth a une session active, considérer l'utilisateur comme authentifié
  if (nextAuthSession) {
    isValidToken = true
  }

  // Si l'utilisateur est connecté et essaie d'accéder à une page publique
  if (isValidToken && isPublicRoute) {
    console.log("Redirection vers /dashboard - Token valide sur route publique")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée
  if (!isValidToken && !isPublicRoute) {
    console.log("Redirection vers /login - Token invalide sur route protégée")
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Laisser passer la requête
  console.log("Requête autorisée à continuer")
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes that don't require authentication)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}

