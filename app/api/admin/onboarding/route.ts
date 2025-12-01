import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

// GET /api/admin/onboarding - Récupérer toutes les données d'onboarding (pour super admin)
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification et les droits
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret") as any
    const userId = decoded.id || decoded.userId

    // Vérifier que l'utilisateur est super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Récupérer toutes les données d'onboarding avec les informations utilisateur
    const onboardingData = await prisma.onboardingData.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            subscriptionStatus: true,
            trialStatus: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Statistiques globales
    const stats = {
      total: onboardingData.length,
      completed: onboardingData.filter(d => d.completed).length,
      withWhatsApp: onboardingData.filter(d => d.whatsappNumber && d.whatsappConsent).length,
      languages: {
        fr: onboardingData.filter(d => d.language === "fr").length,
        en: onboardingData.filter(d => d.language === "en").length
      },
      offers: {
        earlyAccess: onboardingData.filter(d => d.offer === "early-access").length,
        waitlist: onboardingData.filter(d => d.offer === "waitlist").length
      },
      behaviors: {
        details: onboardingData.filter(d => d.diagBehavior === "details").length,
        procrastination: onboardingData.filter(d => d.diagBehavior === "procrastination").length,
        distraction: onboardingData.filter(d => d.diagBehavior === "distraction").length,
        abandon: onboardingData.filter(d => d.diagBehavior === "abandon").length
      }
    }

    return NextResponse.json({ 
      data: onboardingData,
      stats 
    })
  } catch (error) {
    console.error("[ADMIN_ONBOARDING_GET]", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    )
  }
}

