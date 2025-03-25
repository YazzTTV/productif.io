import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { prisma } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const { name, email, password, company } = await req.json()

    // Validation simple
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 })
    }

    // Validation de l'entreprise si fournie
    if (company && !company.name) {
      return NextResponse.json({ error: "Le nom de l'entreprise est requis" }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUserResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "User" WHERE email = ${email}
    `
    const userCount = parseInt(existingUserResult[0].count, 10)
    if (userCount > 0) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
    }

    try {
      // Hashage du mot de passe
      const hashedPassword = await hash(password, 10)
      
      // Générer un ID pour l'utilisateur
      const userId = uuidv4()
      
      // Créer l'utilisateur
      await prisma.$executeRaw`
        INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
        VALUES (${userId}, ${name}, ${email}, ${hashedPassword}, 'USER', NOW(), NOW())
      `
      
      let companyData = null
      
      // Si une entreprise est fournie, créer l'entreprise et établir les relations
      if (company) {
        const companyId = uuidv4()
        
        // Créer l'entreprise
        await prisma.$executeRaw`
          INSERT INTO "Company" (id, name, description, "createdAt", "updatedAt")
          VALUES (${companyId}, ${company.name}, ${company.description || null}, NOW(), NOW())
        `
        
        // Créer l'association entre l'utilisateur et l'entreprise
        await prisma.$executeRaw`
          INSERT INTO "UserCompany" (id, "userId", "companyId", "isActive", "createdAt", "updatedAt")
          VALUES (${uuidv4()}, ${userId}, ${companyId}, true, NOW(), NOW())
        `
        
        // Mettre à jour l'utilisateur pour en faire un administrateur
        await prisma.$executeRaw`
          UPDATE "User"
          SET role = 'ADMIN', "managedCompanyId" = ${companyId}, "updatedAt" = NOW()
          WHERE id = ${userId}
        `
        
        // Récupérer les données de l'entreprise
        const companyResult = await prisma.$queryRaw`
          SELECT * FROM "Company" WHERE id = ${companyId}
        `
        companyData = companyResult[0]
      }
      
      // Récupérer les données de l'utilisateur (sans le mot de passe)
      const userResult = await prisma.$queryRaw`
        SELECT id, name, email, role, "createdAt", "updatedAt" FROM "User" WHERE id = ${userId}
      `
      const userData = userResult[0]
      
      return NextResponse.json(
        {
          success: true,
          message: company 
            ? "Compte utilisateur et entreprise créés avec succès" 
            : "Utilisateur créé avec succès",
          user: userData,
          company: companyData
        },
        { status: 201 }
      )
    } catch (txError) {
      console.error("Erreur lors de la création du compte:", txError)
      return NextResponse.json(
        { error: "Échec lors de la création du compte" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Erreur lors de l'inscription" 
    }, { status: 500 })
  }
}

