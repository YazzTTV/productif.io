import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/apple-calendar/connect
 * 
 * Endpoint pour signaler qu'Apple Calendar est connecté.
 * 
 * Note: Apple Calendar utilise EventKit sur iOS, qui gère l'accès localement.
 * Il n'y a pas d'OAuth comme avec Google. L'app mobile demande directement
 * la permission à iOS, et on enregistre ici que l'utilisateur a accordé l'accès.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { granted, calendarIds } = body

    console.log(`🍎 [APPLE_CALENDAR] Mise à jour pour user ${user.id}`)

    // Stocker ou mettre à jour la connexion Apple Calendar
    await prisma.appleCalendarConnection.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        granted: granted ?? true,
        calendarIds: calendarIds || [],
      },
      update: {
        granted: granted ?? true,
        calendarIds: calendarIds || undefined,
        updatedAt: new Date(),
      },
    })

    console.log(`✅ [APPLE_CALENDAR] Connexion enregistrée pour user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: "Apple Calendar connecté avec succès",
    })

  } catch (error) {
    console.error("❌ [APPLE_CALENDAR] Erreur:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/apple-calendar/connect
 * 
 * Vérifie si l'utilisateur a connecté Apple Calendar
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const connection = await prisma.appleCalendarConnection.findUnique({
      where: { userId: user.id },
    })

    if (!connection) {
      return NextResponse.json({
        connected: false,
      })
    }

    return NextResponse.json({
      connected: connection.granted,
      calendarIds: connection.calendarIds,
      connectedAt: connection.createdAt.toISOString(),
    })

  } catch (error) {
    console.error("❌ [APPLE_CALENDAR] Erreur GET:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/apple-calendar/connect
 * 
 * Déconnecte Apple Calendar
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    await prisma.appleCalendarConnection.deleteMany({
      where: { userId: user.id },
    })

    console.log(`✅ [APPLE_CALENDAR] Déconnexion pour user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: "Apple Calendar déconnecté",
    })

  } catch (error) {
    console.error("❌ [APPLE_CALENDAR] Erreur DELETE:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

