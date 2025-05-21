import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer les informations complètes de l'utilisateur
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managedCompanyId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!userInfo) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Récupérer l'entreprise de l'utilisateur
    const userCompany = await prisma.userCompany.findFirst({
      where: { userId: user.id },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      user: {
        ...userInfo,
        companyName: userCompany?.company?.name || null
      }
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des informations utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

