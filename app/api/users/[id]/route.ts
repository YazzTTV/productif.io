import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { isUserAdmin } from "@/lib/admin-utils"
import { prisma } from "@/lib/prisma"

// GET - Récupérer les détails d'un utilisateur
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer l'utilisateur authentifié
    const currentUser = await getAuthUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer le rôle et l'ID de l'entreprise de l'utilisateur
    const userInfo = await prisma.$queryRaw`
      SELECT 
        "role", 
        "managedCompanyId" 
      FROM "User" 
      WHERE "id" = ${currentUser.id}
    `

    const userRole = userInfo[0]?.role
    const managedCompanyId = userInfo[0]?.managedCompanyId

    // Vérifier les permissions
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer les informations de l'utilisateur demandé
    const userId = params.id
    let userQuery

    if (userRole === "SUPER_ADMIN") {
      // Les SUPER_ADMIN peuvent voir tous les utilisateurs
      userQuery = await prisma.$queryRaw`
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
          u.id = ${userId}
      `
    } else {
      // Les ADMIN ne peuvent voir que les utilisateurs de leur entreprise
      userQuery = await prisma.$queryRaw`
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
          u.id = ${userId}
          AND uc."companyId" = ${managedCompanyId}
      `
    }

    if (!Array.isArray(userQuery) || userQuery.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ user: userQuery[0] })
  } catch (error) {
    console.error("Erreur lors de la récupération des informations utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getAuthUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer le rôle et l'ID de l'entreprise de l'utilisateur
    const userInfo = await prisma.$queryRaw`
      SELECT 
        "role", 
        "managedCompanyId" 
      FROM "User" 
      WHERE "id" = ${currentUser.id}
    `

    const userRole = userInfo[0]?.role
    const managedCompanyId = userInfo[0]?.managedCompanyId

    // Vérifier les permissions
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { name, role } = await request.json()

    // Vérifier si l'utilisateur à modifier existe
    const userExists = await prisma.$queryRaw`
      SELECT EXISTS(SELECT 1 FROM "User" WHERE "id" = ${params.id})
    `

    if (!userExists || !Array.isArray(userExists) || !userExists[0].exists) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Empêcher un administrateur de se rétrograder lui-même
    if (currentUser.id === params.id && role && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ 
        error: "Vous ne pouvez pas rétrograder votre propre rôle d'administrateur" 
      }, { status: 403 })
    }

    // Vérifier si l'utilisateur appartient à l'entreprise de l'admin
    if (userRole === "ADMIN") {
      const userInCompany = await prisma.$queryRaw`
        SELECT EXISTS(
          SELECT 1 FROM "UserCompany" 
          WHERE "userId" = ${params.id} 
          AND "companyId" = ${managedCompanyId}
        ) as "exists"
      `

      if (!userInCompany || !Array.isArray(userInCompany) || !userInCompany[0].exists) {
        return NextResponse.json({ 
          error: "Vous ne pouvez pas modifier les utilisateurs d'autres entreprises" 
        }, { status: 403 })
      }
    }

    // Préparation des données à mettre à jour
    const updateData: Record<string, any> = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (role !== undefined) {
      // Seul un SUPER_ADMIN peut créer ou modifier des SUPER_ADMIN
      if (role === "SUPER_ADMIN" && userRole !== "SUPER_ADMIN") {
        return NextResponse.json({ 
          error: "Seul un super administrateur peut créer ou modifier des super administrateurs" 
        }, { status: 403 })
      }
      updateData.role = role;
    }

    // Mettre à jour l'utilisateur
    await prisma.$executeRaw`
      UPDATE "User"
      SET ${Object.entries(updateData).map(([key, value]) => 
        `${key} = ${value}`
      ).join(", ")}
      WHERE id = ${params.id}
    `

    return NextResponse.json({ 
      message: "Utilisateur mis à jour avec succès" 
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer un utilisateur (réservé aux super admins)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getAuthUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier si l'utilisateur est un super admin
    const userRole = await prisma.$queryRaw`
      SELECT "role" FROM "User" WHERE "id" = ${currentUser.id}
    `

    if (!Array.isArray(userRole) || userRole.length === 0 || userRole[0].role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Seul un super administrateur peut supprimer un utilisateur" }, { status: 403 })
    }

    const userId = params.id

    // Empêcher un super admin de se supprimer lui-même
    if (currentUser.id === userId) {
      return NextResponse.json({ 
        error: "Vous ne pouvez pas supprimer votre propre compte" 
      }, { status: 403 })
    }

    // Vérifier si l'utilisateur à supprimer existe
    const userExists = await prisma.$queryRaw`
      SELECT EXISTS(SELECT 1 FROM "User" WHERE "id" = ${userId})
    `

    if (!userExists || !Array.isArray(userExists) || !userExists[0].exists) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Vérifier si l'utilisateur est admin d'une entreprise
    const isCompanyAdmin = await prisma.$queryRaw`
      SELECT EXISTS(
        SELECT 1 FROM "User" 
        WHERE "id" = ${userId} 
        AND "managedCompanyId" IS NOT NULL
      ) as "isAdmin"
    `

    if (isCompanyAdmin && isCompanyAdmin[0].isAdmin) {
      return NextResponse.json({ 
        error: "Impossible de supprimer un administrateur d'entreprise" 
      }, { status: 403 })
    }

    // Supprimer l'utilisateur
    await prisma.$executeRaw`
      DELETE FROM "User"
      WHERE id = ${userId}
    `

    return NextResponse.json({ 
      message: "Utilisateur supprimé avec succès" 
    })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 