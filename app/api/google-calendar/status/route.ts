import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { googleCalendarService } from "@/lib/calendar/GoogleCalendarService"

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    // Utiliser le service GoogleCalendarService qui gère le refresh automatique
    // Tenter de rafraîchir le token si nécessaire pour vérifier la connexion
    const accessToken = await googleCalendarService.refreshTokenIfNeeded(user.id)
    
    // Si on a un token valide (ou rafraîchi), la connexion est active
    const isConnected = !!accessToken

    return NextResponse.json({
      connected: isConnected,
      hasToken: isConnected,
    })
  } catch (error) {
    console.error("Erreur lors de la vérification du statut Google Calendar:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}



