import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { isUserAdmin } from "@/lib/admin-utils"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const companyId = params.id
    const userId = params.userId

    if (!companyId || !userId) {
      return NextResponse.json(
        { error: "Identifiants manquants" },
        { status: 400 }
      )
    }

    // Vérifier l'authentification
    const currentUser = await getAuthUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour accéder à cette ressource" },
        { status: 401 }
      )
    }

    // Vérifier les droits d'administrateur
    const isAdmin = await isUserAdmin(currentUser.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour accéder à cette ressource" },
        { status: 403 }
      )
    }

    // Vérifier que l'entreprise existe
    const company = await prisma.$queryRaw`
      SELECT id, name FROM "Company" WHERE id = ${companyId}::uuid
    `
    if (!Array.isArray(company) || company.length === 0) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.$queryRaw`
      SELECT id, email FROM "User" WHERE id = ${userId}::uuid
    `
    if (!Array.isArray(user) || user.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur appartient à l'entreprise
    const userCompany = await prisma.$queryRaw`
      SELECT * FROM "UserCompany" 
      WHERE "userId" = ${userId}::uuid AND "companyId" = ${companyId}::uuid
    `
    if (!Array.isArray(userCompany) || userCompany.length === 0) {
      return NextResponse.json(
        { error: "L'utilisateur n'est pas membre de cette entreprise" },
        { status: 404 }
      )
    }

    // Retirer l'utilisateur de l'entreprise
    await prisma.$executeRaw`
      DELETE FROM "UserCompany" 
      WHERE "userId" = ${userId}::uuid AND "companyId" = ${companyId}::uuid
    `

    // Vérifier si l'utilisateur a cette entreprise comme entreprise gérée
    const managedCompanyUsers = await prisma.$queryRaw`
      SELECT * FROM "User" 
      WHERE id = ${userId}::uuid AND "managedCompanyId" = ${companyId}::uuid
    `
    
    // Si c'est le cas, mettre à jour son entreprise gérée à null
    if (Array.isArray(managedCompanyUsers) && managedCompanyUsers.length > 0) {
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "managedCompanyId" = NULL 
        WHERE id = ${userId}::uuid
      `
    }

    return NextResponse.json({ 
      success: true,
      message: "L'utilisateur a été retiré de l'entreprise avec succès" 
    })
    
  } catch (error) {
    console.error("Erreur lors du retrait de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors du retrait de l'utilisateur" },
      { status: 500 }
    )
  }
} 