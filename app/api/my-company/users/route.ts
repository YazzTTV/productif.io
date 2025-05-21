import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const currentUser = await getAuthUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer l'entreprise de l'utilisateur
    const userCompany = await prisma.userCompany.findFirst({
      where: { userId: currentUser.id }
    })

    if (!userCompany) {
      return NextResponse.json({ 
        error: "Vous n'êtes pas associé à une entreprise" 
      }, { status: 404 })
    }

    // Récupérer tous les utilisateurs de la même entreprise
    const users = await prisma.userCompany.findMany({
      where: { 
        companyId: userCompany.companyId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Formater les données pour la réponse
    const formattedUsers = users.map(uc => ({
      id: uc.user.id,
      name: uc.user.name,
      email: uc.user.email,
      role: uc.user.role
    }))

    // Récupérer les informations de l'entreprise
    const company = await prisma.company.findUnique({
      where: { id: userCompany.companyId },
      select: {
        id: true,
        name: true
      }
    })

    return NextResponse.json({ 
      users: formattedUsers,
      company
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des membres de l'entreprise:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 