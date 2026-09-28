/**
 * GET /api/community/leaderboard?scope=friends|group|global[&groupId=]
 *   200 { scope, entries: CommunityEntry[], me: CommunityEntry | null, total, locked? }
 *
 * Classement sur les minutes de revision des 7 derniers jours (lib/community.ts).
 * Amis et groupes sont gratuits : un classement se remplit par les invitations,
 * le mettre derriere le paywall le laisserait vide. Seul le global est premium.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlanInfo } from "@/lib/plans"
import { getFriendIds, globalRanking, rankUsers } from "@/lib/community"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const scope = req.nextUrl.searchParams.get("scope") ?? "friends"
    const friendIds = new Set(await getFriendIds(user.id))

    if (scope === "friends") {
      const entries = await rankUsers([user.id, ...friendIds], user.id, friendIds)
      return NextResponse.json({ scope, entries, me: entries.find((e) => e.isMe) ?? null, total: entries.length })
    }

    if (scope === "group") {
      const groupId = req.nextUrl.searchParams.get("groupId")
      if (!groupId) return NextResponse.json({ error: "groupId requis" }, { status: 400 })
      const members = await prisma.leaderboardGroupMember.findMany({ where: { groupId }, select: { userId: true } })
      if (!members.some((m) => m.userId === user.id)) {
        return NextResponse.json({ error: "Tu n'es pas membre de ce groupe" }, { status: 403 })
      }
      const entries = await rankUsers(members.map((m) => m.userId), user.id, friendIds)
      return NextResponse.json({ scope, entries, me: entries.find((e) => e.isMe) ?? null, total: entries.length })
    }

    if (scope === "global") {
      if (!getPlanInfo(user).limits.allowGlobalLeaderboard) {
        return NextResponse.json({ scope, entries: [], me: null, total: 0, locked: true })
      }
      const { entries, me, total } = await globalRanking(user.id, friendIds)
      return NextResponse.json({ scope, entries, me, total })
    }

    return NextResponse.json({ error: "scope invalide" }, { status: 400 })
  } catch (error) {
    console.error("[community/leaderboard]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
