import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 })
    }

    const body = await req.json()
    const { startTime, currentTime } = body

    if (!startTime || !currentTime) {
      return NextResponse.json(
        { error: "startTime et currentTime sont requis" },
        { status: 400 }
      )
    }

    // Calculer la durée écoulée basée sur les timestamps
    const start = new Date(startTime)
    const current = new Date(currentTime)
    
    if (isNaN(start.getTime()) || isNaN(current.getTime())) {
      return NextResponse.json(
        { error: "Timestamps invalides" },
        { status: 400 }
      )
    }

    const serverElapsed = Math.floor((current.getTime() - start.getTime()) / 1000)
    
    // Vérifier que la durée est logique (pas plus de 24h)
    const maxDuration = 24 * 60 * 60 // 24 heures en secondes
    if (serverElapsed < 0 || serverElapsed > maxDuration) {
      return NextResponse.json(
        { error: "Durée invalide" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      serverTime: new Date().toISOString(),
      serverElapsed,
      startTime: start.toISOString(),
      status: "synchronized"
    })

  } catch (error) {
    console.error("Erreur lors de la synchronisation du timer:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
} 