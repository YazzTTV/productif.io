/**
 * Annulation d'une seance Mode Examen offerte.
 *
 * POST /api/exam/cancel  { sessionToken: string, elapsedSeconds: number }
 *   200 { refunded: boolean, freeRemaining: number | null }
 *
 * Rend la seance si elle est annulee avant EXAM_FREE_REFUND_WINDOW_SECONDS, et
 * seulement EXAM_FREE_REFUND_LIMIT fois par compte : sans plafond, lancer puis
 * annuler en boucle donnerait un blocage gratuit illimite par tranches de
 * 2 minutes (critique du 25 septembre, point 13).
 *
 * Le temps ecoule est juge sur DEUX horloges, celle de l'app et l'age du jeton
 * mesure par le serveur : voir isInRefundWindow (lib/exam/freeSessions.ts).
 *
 * Un premium n'a rien a rendre : { refunded: false, freeRemaining: null }.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EXAM_FREE_REFUND_LIMIT, getExamFreeRemaining, getPlanInfo } from "@/lib/plans"
import { isInRefundWindow, verifyFreeSessionToken } from "@/lib/exam/freeSessions"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const elapsedSeconds = body?.elapsedSeconds
    if (typeof elapsedSeconds !== "number" || !Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
      return NextResponse.json({ error: "elapsedSeconds invalide" }, { status: 400 })
    }

    if (getPlanInfo(user).limits.examModeEnabled) {
      return NextResponse.json({ refunded: false, freeRemaining: null })
    }

    const now = new Date()
    const verified = verifyFreeSessionToken(body?.sessionToken, user.id, now)
    if (!verified) {
      return NextResponse.json({ error: "Jeton de séance invalide", refunded: false }, { status: 400 })
    }

    let refunded = false
    if (isInRefundWindow(elapsedSeconds, verified.startedAt, now)) {
      // Un seul UPDATE conditionnel : le plafond tient meme si la meme
      // annulation arrive deux fois en parallele (reessai reseau), et le
      // compteur ne descend jamais sous zero.
      const result = await prisma.user.updateMany({
        where: { id: user.id, examFreeRefunded: { lt: EXAM_FREE_REFUND_LIMIT }, examFreeUsed: { gt: 0 } },
        data: { examFreeUsed: { decrement: 1 }, examFreeRefunded: { increment: 1 } },
      })
      refunded = result.count === 1
    }

    // Relecture best-effort, comme dans /exam/start : un remboursement deja ecrit
    // ne doit pas etre annonce comme un echec parce que la relecture a rate.
    let freeRemaining: number | null = null
    try {
      const current = await prisma.user.findUnique({
        where: { id: user.id },
        select: { subscriptionStatus: true, subscriptionTier: true, stripeSubscriptionId: true, examFreeUsed: true },
      })
      freeRemaining = current ? getExamFreeRemaining(current) : null
    } catch (error) {
      console.warn("[exam/cancel] relecture du compteur impossible", error)
    }

    return NextResponse.json({ refunded, freeRemaining })
  } catch (error) {
    console.error("[exam/cancel] Erreur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
