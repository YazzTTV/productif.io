import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { isUserAdmin } from "@/lib/admin-utils"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Vérifier l'authentification
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour accéder à cette ressource" },
        { status: 401 }
      )
    }

    // Vérifier si l'utilisateur est administrateur
    const isAdmin = await isUserAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour accéder à cette ressource" },
        { status: 403 }
      )
    }

    // Récupérer le rôle et l'ID de l'entreprise de l'utilisateur
    const userInfo = await prisma.$queryRaw`
      SELECT 
        "role", 
        "managedCompanyId" 
      FROM "User" 
      WHERE "id" = ${user.id}
    `

    const userRole = userInfo[0]?.role
    const managedCompanyId = userInfo[0]?.managedCompanyId

    // Les SUPER_ADMIN peuvent voir tous les utilisateurs
    if (userRole === 'SUPER_ADMIN') {
      const users = await prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u."createdAt",
          c.name as "companyName"
        FROM 
          "User" u
        LEFT JOIN 
          "UserCompany" uc ON u.id = uc."userId"
        LEFT JOIN 
          "Company" c ON uc."companyId" = c.id
        ORDER BY 
          u.name ASC NULLS LAST, 
          u.email ASC
      `
      return NextResponse.json({ users })
    } 
    // Les ADMIN ne peuvent voir que les utilisateurs de leur entreprise
    else if (userRole === 'ADMIN' && managedCompanyId) {
      const users = await prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u."createdAt"
        FROM 
          "User" u
        JOIN 
          "UserCompany" uc ON u.id = uc."userId"
        WHERE 
          uc."companyId" = ${managedCompanyId}
        ORDER BY 
          u.name ASC NULLS LAST, 
          u.email ASC
      `
      return NextResponse.json({ users })
    } else {
      return NextResponse.json(
        { error: "Vous n'avez pas les permissions nécessaires" },
        { status: 403 }
      )
    }
    
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des utilisateurs" },
      { status: 500 }
    )
  }
} 