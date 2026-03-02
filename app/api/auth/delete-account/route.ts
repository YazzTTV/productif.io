import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromRequest } from "@/lib/auth"

/**
 * POST /api/auth/delete-account
 *
 * Suppression/anonymisation du compte utilisateur courant (mobile + web).
 * - Révoque tous les tokens (tokenVersion++)
 * - Supprime les tokens de push, sessions, tokens API, notifications, etc.
 * - Anonymise les données sensibles de l'utilisateur (email, nom, numéros, IDs externes, abonnement)
 *
 * NOTE: On ne supprime pas complètement la ligne User pour éviter les problèmes
 * de contraintes de clé étrangère sur les nombreux modèles liés. Du point de vue
 * de l'utilisateur, le compte est supprimé et toutes les informations
 * personnellement identifiables sont effacées.
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthUserFromRequest(req)

    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Par sécurité, on bloque la suppression directe d'un SUPER_ADMIN
    if (currentUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Les super administrateurs ne peuvent pas supprimer leur compte via cette endpoint." },
        { status: 403 },
      )
    }

    const userId = currentUser.id
    const now = new Date()

    await prisma.$transaction(async (tx) => {
      // Révoquer tous les anciens JWT (tokenVersion++)
      await tx.user.update({
        where: { id: userId },
        data: {
          tokenVersion: { increment: 1 },
        },
      })

      // Nettoyer les données liées critiques / d'authentification
      await Promise.all([
        // Sessions web
        tx.session.deleteMany({ where: { userId } }),

        // Tokens API
        tx.apiToken.deleteMany({ where: { userId } }),

        // Tokens de push (notifications mobiles)
        tx.pushToken.deleteMany({ where: { userId } }),

        // Paramètres & historique de notifications
        tx.notificationHistory.deleteMany({ where: { userId } }),
        tx.notificationSettings.deleteMany({ where: { userId } }),

        // Calendriers
        tx.googleCalendarToken.deleteMany({ where: { userId } }),
        tx.appleCalendarConnection.deleteMany({ where: { userId } }),

        // Check-ins & analytics comportementaux
        tx.behaviorCheckIn.deleteMany({ where: { userId } }),
        tx.behaviorPattern.deleteMany({ where: { userId } }),
        tx.checkInSchedule.deleteMany({ where: { userId } }),

        // Journaux & insights
        tx.journalEntry.deleteMany({ where: { userId } }),
        tx.dailyInsight.deleteMany({ where: { userId } }),

        // Gamification / XP
        tx.xpEvent.deleteMany({ where: { userId } }),
        tx.userGamification.deleteMany({ where: { userId } }),
        tx.streakHistory.deleteMany({ where: { userId } }),
        tx.userAchievement.deleteMany({ where: { userId } }),

        // Groupes / leaderboards
        tx.leaderboardGroupMember.deleteMany({ where: { userId } }),
        tx.leaderboardGroupInvitation.deleteMany({ where: { invitedBy: userId } }),

        // Essai / notifications de trial
        tx.trialNotification.deleteMany({ where: { userId } }),

        // États de conversation agent
        tx.userConversationState.deleteMany({ where: { userId } }),
        tx.agentInteraction.deleteMany({ where: { userId } }),

        // Conversations WhatsApp
        tx.whatsAppConversation.deleteMany({ where: { userId } }),
      ])

      // Nettoyer / anonymiser les données d'onboarding
      await tx.onboardingData.updateMany({
        where: { userId },
        data: {
          language: null,
          mainGoal: null,
          role: null,
          frustration: null,
          firstName: null,
          studentType: null,
          studyLevel: null,
          goals: Prisma.JsonNull,
          pressureLevel: null,
          currentSituation: null,
          dailyStruggles: Prisma.JsonNull,
          mentalLoad: null,
          focusQuality: null,
          satisfaction: null,
          overthinkTasks: null,
          shouldDoMore: null,
          wantToChange: Prisma.JsonNull,
          timeHorizon: null,
          rawTasks: null,
          clarifiedTasks: Prisma.JsonNull,
          idealDay: Prisma.JsonNull,
          whatsappNumber: null,
          whatsappConsent: false,
          offer: null,
          utmParams: Prisma.JsonNull,
          emailFallback: null,
          billingCycle: null,
        },
      })

      // Anonymiser l'utilisateur lui-même
      const anonymizedEmail = `${userId}+deleted@productif.io`

      await tx.user.update({
        where: { id: userId },
        data: {
          name: null,
          email: anonymizedEmail,
          password: `deleted-${userId}-${now.getTime()}`,
          whatsappNumber: null,
          googleSubject: null,
          managedCompanyId: null,

          // Réinitialiser l'abonnement / plan
          subscriptionStatus: "cancelled",
          subscriptionTier: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionEndDate: now,
          cancelledAt: now,
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: "Compte supprimé et données utilisateur anonymisées.",
    })
  } catch (error) {
    console.error("❌ [DELETE_ACCOUNT] Erreur lors de la suppression du compte:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression du compte." },
      { status: 500 },
    )
  }
}
