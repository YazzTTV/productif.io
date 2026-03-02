import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { TrialService } from "@/lib/trial/TrialService"
import { createToken, createSession } from "@/lib/auth"
import { createDefaultHabits } from "@/lib/habits-utils"
import {
  generateEmailVerificationToken,
  getEmailVerificationExpiry,
  sendEmailVerificationEmail,
} from "@/lib/email-verification"

export async function POST(req: Request) {
  try {
    const { name, email, password, company, creatorFlow } = await req.json()

    // Validation simple
    const rawEmail = typeof email === "string" ? email : ""
    const normalizedEmail = rawEmail.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!name || !normalizedEmail || !password) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 })
    }

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 })
    }

    // Validation de l'entreprise si fournie
    if (company && !company.name) {
      return NextResponse.json({ error: "Le nom de l'entreprise est requis" }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
    }

    try {
      // Hashage du mot de passe
      const hashedPassword = await hash(password, 10)
      
      // Créer l'utilisateur
      const emailVerificationToken = generateEmailVerificationToken()
      const emailVerificationExpiresAt = getEmailVerificationExpiry()

      const user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role: 'USER',
          emailVerifiedAt: null,
          emailVerificationToken,
          emailVerificationExpiresAt,
          emailVerificationSentAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          emailVerifiedAt: true,
        }
      })

      // Envoyer l'email de vérification
      try {
        await sendEmailVerificationEmail({
          email: user.email,
          name: user.name,
          token: emailVerificationToken,
        })
      } catch (emailError) {
        console.error("Erreur envoi email de vérification:", emailError)
      }
      
      // Initialiser le trial gratuit de 7 jours
      await TrialService.initializeTrial(user.id)
      
      // Créer les habitudes par défaut pour le nouvel utilisateur
      await createDefaultHabits(user.id)
      
      // Créer une entrée d'onboarding vide pour suivre l'utilisateur
      await prisma.onboardingData.create({
        data: {
          userId: user.id,
          language: 'fr',
          currentStep: 1,
          completed: !!creatorFlow,
        }
      })

      // Si inscription depuis le flow créateur, lier la candidature au user
      if (creatorFlow) {
        await prisma.creatorApplication.updateMany({
          where: { email: normalizedEmail, userId: null },
          data: { userId: user.id },
        })
      }
      
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
