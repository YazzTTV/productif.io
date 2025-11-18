import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"
import { TrialService } from "@/lib/trial/TrialService"
import { createToken, createSession } from "@/lib/auth"
import { createDefaultHabits } from "@/lib/habits-utils"

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
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
    }

    try {
      // Hashage du mot de passe
      const hashedPassword = await hash(password, 10)
      
      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'USER',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      })
      
      // Initialiser le trial gratuit de 7 jours
      await TrialService.initializeTrial(user.id)
      
      // Créer les habitudes par défaut pour le nouvel utilisateur
      await createDefaultHabits(user.id)
      
      // Créer un token JWT pour l'authentification
      const token = await createToken({
        userId: user.id,
        email: user.email,
      })

      // Créer une session
      await createSession(user.id, token)
      
      let companyData = null
      
      // Si une entreprise est fournie, créer l'entreprise et établir les relations
      if (company) {
        const createdCompany = await prisma.company.create({
          data: {
            name: company.name,
            description: company.description || null,
            users: {
              create: {
                userId: user.id,
                isActive: true,
              }
            }
          }
        })

        // Mettre à jour l'utilisateur pour en faire un administrateur
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'ADMIN',
            managedCompanyId: createdCompany.id,
          }
        })

        companyData = createdCompany
      }
      
      return NextResponse.json(
        {
          success: true,
          message: company 
            ? "Compte utilisateur et entreprise créés avec succès ! Profitez de 7 jours d'essai gratuit." 
            : "Compte créé avec succès ! Profitez de 7 jours d'essai gratuit.",
          user,
          company: companyData,
          token: token // Ajouter le token pour l'app mobile
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

