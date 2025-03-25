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

    // Vérifier si l'utilisateur est un super admin
    const userRole = await prisma.$queryRaw`
      SELECT "role" FROM "User" WHERE "id" = ${currentUser.id}
    `

    if (!Array.isArray(userRole) || userRole.length === 0 || userRole[0].role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer les informations de l'utilisateur demandé
    const userId = params.id
    const user = await prisma.$queryRaw`
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

    if (!Array.isArray(user) || user.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ user: user[0] })
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

    // Seuls les administrateurs peuvent modifier le rôle des utilisateurs
    // Un utilisateur normal peut modifier ses propres informations mais pas son rôle
    const isAdmin = await isUserAdmin(currentUser.id)
    const isOwnProfile = currentUser.id === params.id

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
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
    if (isOwnProfile && isAdmin && role && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ 
        error: "Vous ne pouvez pas rétrograder votre propre rôle d'administrateur" 
      }, { status: 403 })
    }

    // Préparation des données à mettre à jour
    const updateData: Record<string, any> = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    // Seul un admin peut changer le rôle, et un SUPER_ADMIN pour promouvoir au rang de SUPER_ADMIN
    if (role !== undefined && isAdmin) {
      // Vérifier si le current user est un super admin pour les promotions SUPER_ADMIN
      if (role === "SUPER_ADMIN") {
        const currentUserRole = await prisma.$queryRaw`
          SELECT "role" FROM "User" WHERE "id" = ${currentUser.id}
        `
        if (!Array.isArray(currentUserRole) || currentUserRole.length === 0 || currentUserRole[0].role !== "SUPER_ADMIN") {
          return NextResponse.json({ 
            error: "Seul un super administrateur peut promouvoir au rang de super administrateur" 
          }, { status: 403 })
        }
      }
      updateData.role = role;
    }

    // Mettre à jour l'utilisateur
    if (Object.keys(updateData).length > 0) {
      // Construire la requête SQL dynamique
      let query = `UPDATE "User" SET `;
      const values: any[] = [];
      const placeholders: string[] = [];
      
      // Ajouter chaque champ à mettre à jour
      Object.entries(updateData).forEach(([key, value], index) => {
        values.push(value);
        placeholders.push(`"${key}" = $${index + 1}`);
      });
      
      query += placeholders.join(", ");
      query += `, "updatedAt" = NOW() WHERE "id" = $${values.length + 1}`;
      values.push(params.id);
      
      await prisma.$executeRawUnsafe(query, ...values);
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await prisma.$queryRaw`
      SELECT "id", "name", "email", "role", "createdAt", "updatedAt"
      FROM "User"
      WHERE "id" = ${params.id}
    `

    return NextResponse.json({ 
      success: true, 
      message: "Utilisateur mis à jour avec succès", 
      user: Array.isArray(updatedUser) && updatedUser.length > 0 ? updatedUser[0] : null
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 