import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlanInfo } from "@/lib/plans"

// GET - Récupérer les informations de l'utilisateur connecté
export async function GET() {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        stripeSubscriptionId: true,
      },
    })

    if (!userInfo) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const planInfo = getPlanInfo(userInfo)

    return NextResponse.json({ 
      user: {
        ...userInfo,
        plan: planInfo.plan,
        planLimits: planInfo.limits,
        isPremium: planInfo.isPremium,
      }
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des informations utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH - Mettre à jour le profil de l'utilisateur connecté
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await req.json()
    const { name } = body

    // Préparation des données à mettre à jour
    const updateData: Record<string, any> = {}
    
    if (name !== undefined) {
      updateData.name = name
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ 
      message: "Profil mis à jour avec succès",
      user: updatedUser
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
