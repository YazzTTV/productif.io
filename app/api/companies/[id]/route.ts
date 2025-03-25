import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { isUserAdmin } from "@/lib/admin-utils"
import { prisma } from "@/lib/prisma"

// GET - Récupérer les détails d'une entreprise
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("GET /api/companies/[id] - ID reçu:", params.id);
    
    const user = await getAuthUser()

    if (!user) {
      console.log("Utilisateur non authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }
    
    console.log("Utilisateur authentifié:", user.id, "Email:", user.email);

    // Vérifier les droits d'accès
    const isAdmin = await isUserAdmin(user.id)
    console.log("Est administrateur:", isAdmin);
    
    if (!isAdmin) {
      // Vérifier si l'utilisateur appartient à cette entreprise
      const userCompany: any[] = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "UserCompany"
        WHERE "userId" = ${user.id} AND "companyId" = ${params.id}
      `
      
      const isCompanyMember = parseInt(userCompany[0]?.count, 10) > 0;
      console.log("Est membre de l'entreprise:", isCompanyMember);
      
      if (!isCompanyMember) {
        return NextResponse.json({ 
          error: "Accès refusé", 
          details: "Vous n'êtes ni administrateur ni membre de cette entreprise" 
        }, { status: 403 })
      }
    }

    const companyId = params.id
    
    // Vérifier le format de l'ID
    let companyQuery;
    try {
      // Tenter de récupérer l'entreprise
      companyQuery = await prisma.$queryRaw`
        SELECT * FROM "Company" WHERE "id" = ${companyId}
      `
    } catch (sqlError) {
      console.error("Erreur SQL lors de la récupération de l'entreprise:", sqlError);
      return NextResponse.json({ 
        error: "Format d'ID invalide", 
        details: "L'ID de l'entreprise n'est pas valide"
      }, { status: 400 })
    }

    console.log("Résultat de la requête entreprise:", companyQuery);

    if (!companyQuery || !Array.isArray(companyQuery) || companyQuery.length === 0) {
      console.log("Entreprise non trouvée pour l'ID:", companyId);
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 })
    }
    
    // Récupérer le nombre d'utilisateurs et d'administrateurs
    const stats = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*)::text FROM "UserCompany" WHERE "companyId" = ${companyId}) as "userCount",
        (SELECT COUNT(*)::text FROM "User" WHERE "managedCompanyId" = ${companyId}) as "adminCount"
    `
    
    console.log("Statistiques de l'entreprise:", stats);

    return NextResponse.json({ 
      company: {
        ...companyQuery[0],
        userCount: stats && Array.isArray(stats) && stats.length > 0 
          ? parseInt(stats[0].userCount || '0', 10) 
          : 0,
        adminCount: stats && Array.isArray(stats) && stats.length > 0 
          ? parseInt(stats[0].adminCount || '0', 10) 
          : 0
      } 
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des détails de l'entreprise:", error)
    return NextResponse.json({ 
      error: "Erreur serveur", 
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}

// PUT - Mettre à jour une entreprise
export async function PUT(
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

    const companyId = params.id
    const { name, description, logo } = await request.json()

    // Validation des données
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Le nom de l'entreprise est requis" }, { status: 400 })
    }

    // Vérifier si l'entreprise existe
    const companyExists = await prisma.$queryRaw`
      SELECT EXISTS(SELECT 1 FROM "Company" WHERE "id" = ${companyId})
    `

    if (!companyExists || !Array.isArray(companyExists) || !companyExists[0].exists) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 })
    }

    // Mettre à jour l'entreprise
    await prisma.$queryRaw`
      UPDATE "Company"
      SET 
        "name" = ${name},
        "description" = ${description || null},
        "logo" = ${logo || null},
        "updatedAt" = NOW()
      WHERE "id" = ${companyId}
    `

    // Récupérer l'entreprise mise à jour
    const updatedCompany = await prisma.$queryRaw`
      SELECT * FROM "Company" WHERE "id" = ${companyId}
    `

    return NextResponse.json({ 
      success: true, 
      message: "Entreprise mise à jour avec succès", 
      company: Array.isArray(updatedCompany) && updatedCompany.length > 0 ? updatedCompany[0] : null
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'entreprise:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer une entreprise
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier les droits d'accès (seul un super admin peut supprimer une entreprise)
    const result = await prisma.$queryRaw`
      SELECT "role" FROM "User" WHERE "id" = ${user.id}
    `
    
    const isSuperAdmin = Array.isArray(result) && result.length > 0 && result[0].role === 'SUPER_ADMIN'
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Seul un super administrateur peut supprimer une entreprise" }, { status: 403 })
    }

    const companyId = params.id

    // Vérifier si l'entreprise existe
    const companyExists = await prisma.$queryRaw`
      SELECT EXISTS(SELECT 1 FROM "Company" WHERE "id" = ${companyId})
    `

    if (!companyExists || !Array.isArray(companyExists) || !companyExists[0].exists) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 })
    }

    // Supprimer les relations UserCompany
    await prisma.$queryRaw`
      DELETE FROM "UserCompany" WHERE "companyId" = ${companyId}
    `
    
    // Mettre à jour les utilisateurs qui ont cette entreprise comme managedCompanyId
    await prisma.$queryRaw`
      UPDATE "User" SET "managedCompanyId" = NULL WHERE "managedCompanyId" = ${companyId}
    `

    // Supprimer l'entreprise
    await prisma.$queryRaw`
      DELETE FROM "Company" WHERE "id" = ${companyId}
    `

    return NextResponse.json({ 
      success: true, 
      message: "Entreprise supprimée avec succès" 
    })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'entreprise:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 