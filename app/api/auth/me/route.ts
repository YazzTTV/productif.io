import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest, verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlanInfo } from "@/lib/plans"
import { getEmailVerificationBlockAt } from "@/lib/email-verification"
import { syncUserTimezone } from "@/lib/timezone"
import { replanUserSafely } from "@/lib/planning/autoPlan"

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
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        emailVerifiedAt: true,
        emailVerificationSentAt: true,
      },
    })
    if (!user) return null
    const blockedAt = getEmailVerificationBlockAt(user.createdAt)
    const isBlocked =
      !user.emailVerifiedAt && !!user.emailVerificationSentAt && new Date() > blockedAt
    if (isBlocked) return null
    return { id: user.id, email: user.email }
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
        updatedAt: true,
        emailVerifiedAt: true,
        emailVerificationSentAt: true,
        timezone: true,
      }
    })

    if (!userInfo) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // L'app mobile envoie le fuseau de l'appareil a chaque appel ; on le garde a jour
    // pour les rappels et la planification (un etudiant a Montreal n'est pas a Paris).
    const timezone = await syncUserTimezone(
      user.id,
      req.headers.get("x-timezone"),
      userInfo.timezone,
      req.headers.get("x-vercel-ip-timezone")
    )
    // Le planning a ete calcule dans l'ancien fuseau : on le recalcule. Rare
    // (premier lancement, voyage), donc le cout ne tombe presque jamais.
    if (timezone !== userInfo.timezone) {
      await replanUserSafely(user.id, "manual", 5000)
    }

    const planInfo = getPlanInfo(user)
    const emailVerificationDueAt = getEmailVerificationBlockAt(userInfo.createdAt)
    const emailVerificationRequired = !!userInfo.emailVerificationSentAt && !userInfo.emailVerifiedAt
    const emailVerificationBlocked =
      emailVerificationRequired && new Date() > emailVerificationDueAt

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
        timezone,
        companyName: userCompany?.company?.name || null,
        plan: planInfo.plan,
        planLimits: planInfo.limits,
        isPremium: planInfo.isPremium,
        emailVerified: !!userInfo.emailVerifiedAt || !emailVerificationRequired,
        emailVerificationRequired,
        emailVerificationDueAt,
        emailVerificationBlocked,
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
