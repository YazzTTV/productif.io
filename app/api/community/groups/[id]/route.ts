/**
 * DELETE /api/community/groups/:id   200 { left: true, deleted: boolean }
 *
 * Quitter un groupe. Le dernier membre qui part supprime le groupe, sinon il
 * resterait une coquille vide dont le code marcherait encore.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    const { id } = await params
    await prisma.leaderboardGroupMember.deleteMany({ where: { groupId: id, userId: user.id } })
    const remaining = await prisma.leaderboardGroupMember.count({ where: { groupId: id } })
    let deleted = false
    if (remaining === 0) {
      deleted = (await prisma.leaderboardGroup.deleteMany({ where: { id } })).count > 0
    }
    return NextResponse.json({ left: true, deleted })
  } catch (error) {
    console.error("[community/groups DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
