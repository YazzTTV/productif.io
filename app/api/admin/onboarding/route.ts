import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isUserAdmin } from "@/lib/admin-utils"

// GET /api/admin/onboarding - Récupérer toutes les données d'onboarding (pour super admin)
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification et les droits
    const authUser = await getAuthUser()
    
    if (!authUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est super admin
    const isSuperAdmin = await isUserAdmin(authUser.id, true)
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Vous n'avez pas les permissions nécessaires" }, { status: 403 })
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

