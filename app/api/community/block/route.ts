/**
 * POST /api/community/block { userId }
 *   200 { blocked: true }
 *
 * Bloque un membre : l'amitie est retiree dans les deux sens, et aucun des deux
 * ne voit plus l'autre dans aucun classement (lib/community.ts getHiddenIds).
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    const body = await req.json().catch(() => null)
    const blockedId = typeof body?.userId === "string" ? body.userId : ""
    if (!blockedId || blockedId === user.id) {
      return NextResponse.json({ error: "userId invalide" }, { status: 400 })
    }
    const target = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } })
    if (!target) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })

    await prisma.$transaction([
      prisma.userBlock.upsert({
        where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
        create: { blockerId: user.id, blockedId },
        update: {},
      }),
      prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId: user.id, friendId: blockedId },
            { userId: blockedId, friendId: user.id },
          ],
        },
      }),
    ])
    return NextResponse.json({ blocked: true })
  } catch (error) {
    console.error("[community/block POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
