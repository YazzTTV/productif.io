/**
 * POST /api/community/report { userId? , groupId?, reason }
 *   200 { reported: true }
 *
 * Signale un membre ou un groupe. Le signalement est enregistre puis une alerte
 * part par email (lib/moderation.ts) ; il est traite a la main sous 24 h.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { REPORT_REASONS, sendReportAlert } from "@/lib/moderation"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    const body = await req.json().catch(() => null)
    const targetUserId = typeof body?.userId === "string" && body.userId ? body.userId : null
    const groupId = typeof body?.groupId === "string" && body.groupId ? body.groupId : null
    const reason = (REPORT_REASONS as readonly string[]).includes(body?.reason) ? body.reason : "other"
    if (!targetUserId === !groupId) {
      return NextResponse.json({ error: "userId ou groupId requis" }, { status: 400 })
    }
    if (targetUserId === user.id) return NextResponse.json({ error: "userId invalide" }, { status: 400 })

    let targetLabel = ""
    if (targetUserId) {
      const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true } })
      if (!target) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })
      targetLabel = `compte ${target.id} (nom : ${target.name ?? "vide"})`
    } else {
      const group = await prisma.leaderboardGroup.findUnique({ where: { id: groupId! }, select: { id: true, name: true } })
      if (!group) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
      targetLabel = `groupe ${group.id} (nom : ${group.name})`
    }

    const report = await prisma.communityReport.create({
      data: { reporterId: user.id, targetUserId, groupId, reason },
    })
    await sendReportAlert({ ...report, targetLabel })
    return NextResponse.json({ reported: true })
  } catch (error) {
    console.error("[community/report POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
