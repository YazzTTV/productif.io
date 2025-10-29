import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verify } from "jsonwebtoken"
import { TrialService } from "@/lib/trial/TrialService"

// Définir les routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  "/", 
  "/login", 
  "/register", 
  "/onboarding",
  "/upgrade", 
  "/api/auth/login", 
  "/api/auth/register",
  "/api/webhooks/stripe",
  "/merci",
  "/pricing",
  "/tarifs",
  "/cgv",
  "/legal",
  "/privacy-policy",
  "/terms",
  "/refund-policy"
]

export async function middleware(request: NextRequest) {
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
      const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret") as { userId: string }
      
      // Vérifier le trial pour les routes dashboard
      if (request.nextUrl.pathname.startsWith("/dashboard")) {
        const accessCheck = await TrialService.hasAccess(decoded.userId)
        
        if (!accessCheck.hasAccess) {
          // Rediriger vers la page d'upgrade si le trial est expiré
          return NextResponse.redirect(new URL("/upgrade", request.url))
        }
        
        // Ajouter les infos de trial dans les headers
        const response = NextResponse.next()
        response.headers.set("X-Trial-Status", accessCheck.status)
        
        if (accessCheck.trialDaysLeft !== undefined) {
          response.headers.set("X-Trial-Days-Left", accessCheck.trialDaysLeft.toString())
        }
        
        return response
      }
      
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

