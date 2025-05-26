import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiAuth } from "@/middleware/api-auth"

export async function GET(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['habits:read']
  })
  
  // Si l'authentification a échoué, retourner la réponse d'erreur
  if (authResponse) {
    return authResponse
  }
  
  // Extraire l'ID de l'utilisateur à partir de l'en-tête (ajouté par le middleware)
  const userId = req.headers.get('x-api-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }

  try {
    // Récupérer toutes les entrées d'habitudes de l'utilisateur
    const entries = await prisma.habitEntry.findMany({
      where: {
        habit: {
          userId: userId,
        },
      },
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Erreur lors de la récupération de toutes les entrées d'habitudes:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des entrées d'habitudes" },
      { status: 500 }
    )
  }
} 