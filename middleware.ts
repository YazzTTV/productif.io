import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

// Routes à ignorer complètement
const ignoredRoutes = ["/_next", "/favicon.ico", "/api/", ".png", ".jpg", ".svg", ".ico"]

// Routes protégées qui nécessitent une authentification
const protectedRoutes = ["/dashboard"]

// Routes publiques (pas besoin de lister toutes, uniquement celles qui pourraient interférer)
const publicRoutes = ["/login", "/register", "/"]

export async function middleware(request: NextRequest) {
  // Désactivation complète du middleware - solution éprouvée
  return NextResponse.next()
  
  /* Middleware désactivé car problème de boucle de redirection persistant
  const url = request.nextUrl.pathname

  // Ignorer les assets statiques et les routes API
  if (ignoredRoutes.some(route => url.includes(route))) {
    return NextResponse.next()
  }

  // Récupérer le token depuis les cookies
  const token = request.cookies.get("auth_token")?.value
  const nextAuthSession = request.cookies.get("next-auth.session-token")?.value
  const vercelNextAuthSession = request.cookies.get("__Secure-next-auth.session-token")?.value

  // Déterminer si l'utilisateur est authentifié
  let isAuthenticated = false
  
  if (token) {
    try {
      const decoded = await verifyToken(token)
      isAuthenticated = decoded !== null
    } catch (error) {
      isAuthenticated = false
    }
  }
  
  if (nextAuthSession || vercelNextAuthSession) {
    isAuthenticated = true
  }

  // RÈGLE SIMPLE 1 : Si l'utilisateur est sur une route protégée et n'est pas authentifié -> rediriger vers login
  if (protectedRoutes.some(route => url.startsWith(route)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // RÈGLE SIMPLE 2 : Si l'utilisateur est authentifié et sur la page login/register/accueil -> rediriger vers dashboard
  // Mais uniquement lors de l'accès direct à ces pages, pas entre elles
  if (isAuthenticated && (url === "/login" || url === "/register" || url === "/")) {
    // Ajouter un paramètre pour éviter les boucles
    const referer = request.headers.get("referer") || ""
    if (!referer.includes("/dashboard")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Dans tous les autres cas, continuer normalement
  return NextResponse.next()
  */
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

