import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Récupérer l'utilisateur authentifié
    const user = await getAuthUser()
    console.log("User récupéré par getAuthUser:", user)

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer des informations complètes, y compris l'entreprise
    const userInfo = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u."createdAt",
        u."managedCompanyId",
        c.name as "companyName"
      FROM 
        "User" u
      LEFT JOIN 
        "Company" c ON u."managedCompanyId" = c.id
      WHERE 
        u.id = ${user.id}
    `
    console.log("User info obtenue par SQL:", userInfo)

    // Récupérer les entreprises auxquelles l'utilisateur appartient
    const userCompanies = await prisma.$queryRaw`
      SELECT 
        c.id, 
        c.name, 
        uc."isActive"
      FROM 
        "Company" c
      JOIN 
        "UserCompany" uc ON c.id = uc."companyId"
      WHERE 
        uc."userId" = ${user.id}
    `
    console.log("User companies obtenues par SQL:", userCompanies)

    // Ne pas renvoyer le mot de passe
    const userWithoutPassword = Array.isArray(userInfo) && userInfo.length > 0 
      ? userInfo[0] 
      : { ...user, password: undefined }
      
    console.log("Données finales renvoyées:", {
      success: true,
      user: userWithoutPassword,
      companies: userCompanies
    })

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      companies: userCompanies
    })
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

