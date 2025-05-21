import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface UserInfo {
  role: string
  managedCompanyId: string | null
}

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const currentUser = await getAuthUser()
    const { id: userId } = context.params

    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier si l'utilisateur demande ses propres informations ou s'il est admin
    const userInfo = await prisma.$queryRaw<UserInfo[]>`
      SELECT 
        "role", 
        "managedCompanyId" 
      FROM "User" 
      WHERE "id" = ${currentUser.id}
    `

    const userRole = userInfo[0]?.role
    const managedCompanyId = userInfo[0]?.managedCompanyId

    // Seul l'utilisateur lui-même ou un admin peut accéder à ces informations
    if (currentUser.id !== userId && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Si l'utilisateur est admin, vérifier qu'il accède à un utilisateur de son entreprise
    if (userRole === "ADMIN" && currentUser.id !== userId) {
      const userInCompany = await prisma.$queryRaw`
        SELECT EXISTS(
          SELECT 1 FROM "UserCompany" 
          WHERE "userId" = ${userId} 
          AND "companyId" = ${managedCompanyId}
        ) as "exists"
      `

      if (!userInCompany || !Array.isArray(userInCompany) || !userInCompany[0].exists) {
        return NextResponse.json({ 
          error: "Vous ne pouvez pas accéder aux informations des utilisateurs d'autres entreprises" 
        }, { status: 403 })
      }
    }

    // Récupérer l'entreprise de l'utilisateur
    const company = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        c."createdAt",
        c."updatedAt"
      FROM "Company" c
      JOIN "UserCompany" uc ON c.id = uc."companyId"
      WHERE uc."userId" = ${userId}
      LIMIT 1
    `

    if (!Array.isArray(company) || company.length === 0) {
      return NextResponse.json({ error: "Aucune entreprise trouvée" }, { status: 404 })
    }

    return NextResponse.json({ company: company[0] })
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entreprise:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 