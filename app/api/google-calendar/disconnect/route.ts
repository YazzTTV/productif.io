import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    // Supprimer le token Google Calendar
    await prisma.googleCalendarToken.delete({
      where: { userId: user.id },
    }).catch(() => {
      // Ignorer si le token n'existe pas
    })

    return NextResponse.json({
      success: true,
      message: "Google Calendar déconnecté avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de la déconnexion Google Calendar:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}







