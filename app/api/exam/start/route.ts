/**
 * Lancement d'une seance Mode Examen.
 *
 * POST /api/exam/start  { plannedMinutes: number, launchKey?: string }
 *   200 { allowed: true, premium, sessionToken, freeRemaining }
 *   403 { allowed: false, reason: 'quota_exhausted' }
 *
 * Un premium passe toujours (sessionToken et freeRemaining a null). Un gratuit
 * consomme une des EXAM_FREE_SESSIONS seances offertes, avec blocage, et recoit
 * un jeton a renvoyer a POST /api/exam/cancel s'il annule tout de suite.
 *
 * Le decompte est un seul UPDATE conditionnel : deux lancements simultanes
 * (double tap, requete rejouee) ne peuvent pas passer tous les deux sur la
 * derniere seance, ce qu'un « lire puis ecrire » permettait.
 *
 * L'app est fail-closed sur cette route (mobile-app-new/app/exam/setup.tsx) :
 * sans reponse, elle ne lance rien. Un 5xx ne donne donc jamais de seance.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EXAM_FREE_SESSIONS, getExamFreeRemaining, getPlanInfo } from "@/lib/plans"
import { createFreeSessionToken } from "@/lib/exam/freeSessions"

export const dynamic = "force-dynamic"

// Bornes de sante seulement : la duree reelle est choisie dans l'app.
const MIN_PLANNED_MINUTES = 1
const MAX_PLANNED_MINUTES = 12 * 60

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const plannedMinutes = body?.plannedMinutes
    if (
      typeof plannedMinutes !== "number" ||
      !Number.isFinite(plannedMinutes) ||
      plannedMinutes < MIN_PLANNED_MINUTES ||
      plannedMinutes > MAX_PLANNED_MINUTES
    ) {
      return NextResponse.json({ error: "plannedMinutes invalide" }, { status: 400 })
    }

    if (getPlanInfo(user).limits.examModeEnabled) {
      return NextResponse.json({ allowed: true, premium: true, sessionToken: null, freeRemaining: null })
    }

    // Cle de lancement, generee par l'app une fois par seance et rejouee si la
    // reponse se perd : le meme lancement ne se decompte qu'une fois.
    const launchKey =
      typeof body?.launchKey === "string" && body.launchKey.length > 0 && body.launchKey.length <= 100
        ? body.launchKey
        : null
    if (launchKey) {
      const last = await prisma.user.findUnique({
        where: { id: user.id },
        select: { examFreeLastKey: true, examFreeLastToken: true, subscriptionStatus: true, subscriptionTier: true, stripeSubscriptionId: true, examFreeUsed: true },
      })
      if (last && last.examFreeLastKey === launchKey && last.examFreeLastToken) {
        return NextResponse.json({
          allowed: true,
          premium: false,
          sessionToken: last.examFreeLastToken,
          freeRemaining: getExamFreeRemaining(last),
        })
      }
    }

    // Signe AVANT de decompter : une seance decomptee sans jeton renvoye serait
    // perdue pour l'etudiant (500 apres l'ecriture).
    const sessionToken = createFreeSessionToken(user.id)

    const claimed = await prisma.user.updateMany({
      where: { id: user.id, examFreeUsed: { lt: EXAM_FREE_SESSIONS } },
      data: {
        examFreeUsed: { increment: 1 },
        ...(launchKey ? { examFreeLastKey: launchKey, examFreeLastToken: sessionToken } : {}),
      },
    })
    if (claimed.count === 0) {
      return NextResponse.json({ allowed: false, reason: "quota_exhausted" }, { status: 403 })
    }

    // Relu apres l'ecriture pour renvoyer le chiffre reel, meme si un autre
    // lancement est passe entre-temps. Une relecture ratee ne doit pas faire
    // echouer une seance deja decomptee : on renvoie alors null, et l'app relit
    // le compteur par /api/auth/me (elle invalide son cache apres cet appel).
    let freeRemaining: number | null = null
    try {
      const after = await prisma.user.findUnique({
        where: { id: user.id },
        select: { subscriptionStatus: true, subscriptionTier: true, stripeSubscriptionId: true, examFreeUsed: true },
      })
      freeRemaining = after ? getExamFreeRemaining(after) : null
    } catch (error) {
      console.warn("[exam/start] relecture du compteur impossible", error)
    }

    return NextResponse.json({ allowed: true, premium: false, sessionToken, freeRemaining })
  } catch (error) {
    console.error("[exam/start] Erreur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
