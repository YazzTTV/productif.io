import { prisma } from "./prisma"

// Vérifie si un utilisateur est administrateur via une requête SQL directe
// Contourne le problème de Prisma client qui n'a pas encore le champ role
export async function isUserAdmin(userId: string, requireSuperAdmin: boolean = false): Promise<boolean> {
  try {
    // Exécuter une requête SQL directe pour vérifier le rôle
    const result = await prisma.$queryRaw`
      SELECT "role" FROM "User" WHERE "id" = ${userId}
    `
    
    // Si un résultat est trouvé, vérifier le rôle
    if (Array.isArray(result) && result.length > 0) {
      const userRole = result[0].role
      
      if (requireSuperAdmin) {
        return userRole === 'SUPER_ADMIN'
      }
      
      return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
    }
    
    return false
  } catch (error) {
    console.error("Erreur lors de la vérification des droits d'administration:", error)
    return false
  }
}

// Fonction pour obtenir tous les utilisateurs avec leur rôle
export async function getAllUsers() {
  try {
    const users = await prisma.$queryRaw`
      SELECT "id", "name", "email", "role", "createdAt", "updatedAt" 
      FROM "User"
      ORDER BY "createdAt" DESC
    `
    
    return users
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return []
  }
}

// Obtenir les entreprises selon le rôle de l'utilisateur
export async function getAllCompanies(userId?: string) {
  try {
    // Si l'ID utilisateur est fourni, vérifier son rôle et son entreprise
    if (userId) {
      const userInfo: any[] = await prisma.$queryRaw`
        SELECT "role", "managedCompanyId" FROM "User" WHERE "id" = ${userId}
      `
      
      // Si l'utilisateur est un ADMIN normal, retourner uniquement son entreprise
      if (userInfo[0]?.role === 'ADMIN' && userInfo[0]?.managedCompanyId) {
        const companyId = userInfo[0].managedCompanyId
        
        const companies = await prisma.$queryRaw`
          SELECT 
            c."id", 
            c."name", 
            c."description", 
            c."logo", 
            c."createdAt", 
            c."updatedAt",
            COUNT(DISTINCT uc."userId")::text as "userCount",
            COUNT(DISTINCT u."id")::text as "adminCount"
          FROM "Company" c
          LEFT JOIN "UserCompany" uc ON c."id" = uc."companyId"
          LEFT JOIN "User" u ON c."id" = u."managedCompanyId"
          WHERE c."id" = ${companyId}
          GROUP BY c."id"
        `
        
        // Convertir les chaînes de nombres en nombres
        return companies.map((company: any) => ({
          ...company,
          userCount: parseInt(company.userCount || '0', 10),
          adminCount: parseInt(company.adminCount || '0', 10)
        }));
      }
    }
    
    // Sinon retourner toutes les entreprises (pour SUPER_ADMIN ou appel sans userId)
    const companies = await prisma.$queryRaw`
      SELECT 
        c."id", 
        c."name", 
        c."description", 
        c."logo", 
        c."createdAt", 
        c."updatedAt",
        COUNT(DISTINCT uc."userId")::text as "userCount",
        COUNT(DISTINCT u."id")::text as "adminCount"
      FROM "Company" c
      LEFT JOIN "UserCompany" uc ON c."id" = uc."companyId"
      LEFT JOIN "User" u ON c."id" = u."managedCompanyId"
      GROUP BY c."id"
      ORDER BY c."createdAt" DESC
    `
    
    // Convertir les chaînes de nombres en nombres
    return companies.map((company: any) => ({
      ...company,
      userCount: parseInt(company.userCount || '0', 10),
      adminCount: parseInt(company.adminCount || '0', 10)
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des entreprises:", error)
    return []
  }
}

// Créer une nouvelle entreprise
export async function createCompany(name: string, description?: string, logo?: string, adminId?: string) {
  try {
    // Insérer la nouvelle entreprise
    const company = await prisma.$queryRaw`
      INSERT INTO "Company" ("name", "description", "logo", "createdAt", "updatedAt")
      VALUES (${name}, ${description || null}, ${logo || null}, NOW(), NOW())
      RETURNING *
    `
    
    // Si un adminId est fourni, lier l'administrateur à l'entreprise
    if (adminId && Array.isArray(company) && company.length > 0) {
      const companyId = company[0].id
      
      await prisma.$queryRaw`
        UPDATE "User"
        SET "managedCompanyId" = ${companyId}
        WHERE "id" = ${adminId}
      `
    }
    
    return Array.isArray(company) ? company[0] : null
  } catch (error) {
    console.error("Erreur lors de la création de l'entreprise:", error)
    return null
  }
}

// Fonction pour vérifier et obtenir l'entreprise gérée par un administrateur
export async function getManagedCompany(userId: string) {
  try {
    console.log("Vérification de l'entreprise gérée pour l'utilisateur:", userId)

    // Vérifier d'abord si l'utilisateur est administrateur
    const isAdmin = await isUserAdmin(userId)
    if (!isAdmin) {
      console.log("L'utilisateur n'est pas administrateur")
      return null
    }

    // Récupérer l'ID de l'entreprise gérée directement dans User
    const userInfo = await prisma.$queryRaw`
      SELECT "role", "managedCompanyId" FROM "User" WHERE "id" = ${userId}
    `
    console.log("Informations utilisateur récupérées:", userInfo)
    
    let companyId = null
    
    // Vérifier si managedCompanyId est défini
    if (Array.isArray(userInfo) && userInfo.length > 0 && userInfo[0].managedCompanyId) {
      companyId = userInfo[0].managedCompanyId
      console.log("ID de l'entreprise gérée trouvé dans User:", companyId)
    } 
    // Si pas d'entreprise gérée définie mais c'est un ADMIN, chercher dans UserCompany
    else if (Array.isArray(userInfo) && userInfo.length > 0 && userInfo[0].role === 'ADMIN') {
      console.log("Pas d'entreprise gérée trouvée dans User pour cet admin, recherche dans UserCompany")
      
      // Chercher la première entreprise associée à cet utilisateur
      const userCompanies = await prisma.$queryRaw`
        SELECT uc."companyId" 
        FROM "UserCompany" uc 
        WHERE uc."userId" = ${userId} 
        LIMIT 1
      `
      
      console.log("Entreprises associées trouvées:", userCompanies)
      
      if (Array.isArray(userCompanies) && userCompanies.length > 0) {
        companyId = userCompanies[0].companyId
        console.log("ID de l'entreprise associée trouvé dans UserCompany:", companyId)
        
        // Mettre à jour le champ managedCompanyId de l'utilisateur
        await prisma.$queryRaw`
          UPDATE "User" 
          SET "managedCompanyId" = ${companyId} 
          WHERE "id" = ${userId}
        `
        console.log(`Le champ managedCompanyId de l'utilisateur ${userId} a été mis à jour avec ${companyId}`)
      }
    }
    
    if (!companyId) {
      console.log("Aucune entreprise gérée ou associée trouvée pour cet administrateur")
      return null
    }
    
    // Récupérer les détails de l'entreprise
    const companyDetails = await prisma.$queryRaw`
      SELECT 
        c."id", 
        c."name", 
        c."description", 
        c."logo", 
        c."createdAt", 
        c."updatedAt",
        COUNT(DISTINCT uc."userId")::text as "userCount"
      FROM "Company" c
      LEFT JOIN "UserCompany" uc ON c."id" = uc."companyId"
      WHERE c."id" = ${companyId}
      GROUP BY c."id"
    `

    if (!Array.isArray(companyDetails) || companyDetails.length === 0) {
      console.log("Détails de l'entreprise non trouvés")
      return null
    }

    const company = {
      ...companyDetails[0],
      userCount: parseInt(companyDetails[0].userCount || '0', 10)
    }
    
    console.log("Entreprise gérée trouvée:", company)
    return company
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entreprise gérée:", error)
    return null
  }
} 