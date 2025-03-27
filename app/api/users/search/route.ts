import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { isUserAdmin } from "@/lib/admin-utils"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier les droits d'accès
    const isAdmin = await isUserAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer le terme de recherche
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ users: [] })
    }

    // Rechercher les utilisateurs
    const users = await prisma.$queryRaw`
      SELECT 
        u."id",
        u."name",
        u."email",
        u."createdAt"
      FROM "User" u
      WHERE 
        (u."name" ILIKE ${`%${query}%`} OR u."email" ILIKE ${`%${query}%`})
      ORDER BY 
        CASE 
          WHEN u."name" ILIKE ${`${query}%`} THEN 1
          WHEN u."email" ILIKE ${`${query}%`} THEN 2
          ELSE 3
        END,
        u."name",
        u."email"
      LIMIT 10
    `

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Erreur lors de la recherche des utilisateurs:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 