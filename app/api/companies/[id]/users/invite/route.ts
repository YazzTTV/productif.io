import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { hash } from "bcrypt"
import { prisma } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id

    if (!companyId) {
      return NextResponse.json(
        { error: "Identifiant d'entreprise manquant" },
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

    // Vérifier que l'utilisateur est un administrateur de cette entreprise spécifique
    const adminCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM "User" 
        WHERE id = ${currentUser.id} 
        AND ("role" = 'SUPER_ADMIN' OR "managedCompanyId" = ${companyId})
      ) as "isAdmin"
    `

    if (!adminCheck[0]?.isAdmin) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour inviter des utilisateurs dans cette entreprise" },
        { status: 403 }
      )
    }

    // Vérifier que l'entreprise existe
    const company = await prisma.$queryRaw`
      SELECT id, name FROM "Company" WHERE id = ${companyId}
    `

    if (!Array.isArray(company) || company.length === 0) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      )
    }

    // Extraire les données de la requête
    const { name, email, password } = await request.json()
    
    // Validation des données
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe sont requis" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "User" WHERE email = ${email}
    `
    
    if (parseInt(existingUser[0]?.count, 10) > 0) {
      return NextResponse.json(
        { error: "Un utilisateur avec cette adresse email existe déjà" },
        { status: 409 }
      )
    }

    // Hashage du mot de passe
    const hashedPassword = await hash(password, 10)
    
    // Créer l'utilisateur et l'association avec l'entreprise
    const userId = uuidv4()
    
    // Créer l'utilisateur
    await prisma.$executeRaw`
      INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
      VALUES (${userId}, ${name || email}, ${email}, ${hashedPassword}, 'USER', NOW(), NOW())
    `
    
    // Créer l'association entre l'utilisateur et l'entreprise
    await prisma.$executeRaw`
      INSERT INTO "UserCompany" (id, "userId", "companyId", "isActive", "createdAt", "updatedAt")
      VALUES (${uuidv4()}, ${userId}, ${companyId}, true, NOW(), NOW())
    `
    
    // Récupérer les informations de l'utilisateur créé (sans le mot de passe)
    const newUser = await prisma.$queryRaw`
      SELECT id, name, email, role, "createdAt" FROM "User" WHERE id = ${userId}
    `
    
    return NextResponse.json(
      {
        success: true,
        message: "L'utilisateur a été ajouté à votre entreprise avec succès",
        user: newUser[0]
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error("Erreur lors de l'invitation d'un utilisateur:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'invitation de l'utilisateur" },
      { status: 500 }
    )
  }
} 