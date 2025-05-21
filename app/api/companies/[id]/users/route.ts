import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { isUserAdmin } from "@/lib/admin-utils"
import { prisma } from "@/lib/prisma"

// GET - Récupérer les utilisateurs d'une entreprise
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("GET /api/companies/[id]/users - Params:", params)
    
    const user = await getAuthUser()
    console.log("User authentifié:", user)

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier les droits d'accès
    const isAdmin = await isUserAdmin(user.id)
    console.log("Est administrateur:", isAdmin)
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { id: companyId } = params
    console.log("ID de l'entreprise:", companyId)

    // Vérifier si l'entreprise existe
    const companyExists = await prisma.$queryRaw`
      SELECT EXISTS(SELECT 1 FROM "Company" WHERE "id" = ${companyId})
    `
    console.log("L'entreprise existe:", companyExists)

    if (!companyExists || !companyExists[0].exists) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 })
    }

    // Récupérer les utilisateurs de l'entreprise
    const users = await prisma.$queryRaw`
      SELECT 
        u."id", 
        u."name", 
        u."email", 
        u."role", 
        u."createdAt", 
        uc."createdAt" as "joinedAt",
        uc."isActive"
      FROM "User" u
      JOIN "UserCompany" uc ON u."id" = uc."userId"
      WHERE uc."companyId" = ${companyId}
      ORDER BY uc."createdAt" DESC
    `
    console.log("Utilisateurs trouvés:", users)

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Ajouter un utilisateur à une entreprise
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id: companyId } = params
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "L'identifiant de l'utilisateur est requis" }, { status: 400 })
    }

    // Vérifier si l'entreprise existe
    const companyExists = await prisma.$queryRaw`
      SELECT EXISTS(SELECT 1 FROM "Company" WHERE "id" = ${companyId})
    `

    if (!companyExists || !companyExists[0].exists) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 })
    }

    // Vérifier si l'utilisateur existe
    const userExists = await prisma.$queryRaw`
      SELECT EXISTS(SELECT 1 FROM "User" WHERE "id" = ${userId})
    `

    if (!userExists || !userExists[0].exists) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Vérifier si l'utilisateur est déjà dans l'entreprise
    const userInCompany = await prisma.$queryRaw`
      SELECT EXISTS(SELECT 1 FROM "UserCompany" WHERE "userId" = ${userId} AND "companyId" = ${companyId})
    `

    if (userInCompany && userInCompany[0].exists) {
      return NextResponse.json({ error: "L'utilisateur est déjà dans cette entreprise" }, { status: 409 })
    }

    // Ajouter l'utilisateur à l'entreprise
    await prisma.$queryRaw`
      INSERT INTO "UserCompany" ("id", "userId", "companyId", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${userId}, ${companyId}, true, NOW(), NOW())
    `

    return NextResponse.json({
      success: true,
      message: "Utilisateur ajouté à l'entreprise avec succès"
    }, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'utilisateur à l'entreprise:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 