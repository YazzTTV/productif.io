import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest, verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlanInfo } from "@/lib/plans"

async function minimalUserFromToken(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    let token: string | null = null
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      token = req.cookies.get("auth_token")?.value || null
    }
    if (!token) return null
    const decoded = await verifyToken(token)
    if (!decoded) return null
    return { id: decoded.userId, email: decoded.email }
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      // Fallback: tenter un retour minimal basé sur le JWT pour ne pas casser l'UI
      const minimal = await minimalUserFromToken(req)
      if (minimal) {
        return NextResponse.json({ user: { id: minimal.id ?? null, email: minimal.email ?? "" } })
      }
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

    const planInfo = getPlanInfo(user)

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
        companyName: userCompany?.company?.name || null,
        plan: planInfo.plan,
        planLimits: planInfo.limits,
        isPremium: planInfo.isPremium,
      }
    })
  } catch (error: any) {
    // Si la base renvoie une erreur de quota, renvoyer un utilisateur minimal pour ne pas casser l'UX
    const message = String(error?.message || "")
    if (message.includes("exceeded the data transfer quota")) {
      const minimal = await minimalUserFromToken(req)
      if (minimal) {
        return NextResponse.json({ user: { id: minimal.id ?? null, email: minimal.email ?? "" } })
      }
    }
    console.error("Erreur lors de la récupération des informations utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
