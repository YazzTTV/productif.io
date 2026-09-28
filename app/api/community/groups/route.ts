/**
 * GET  /api/community/groups            200 { groups: CommunityGroup[] }
 * POST /api/community/groups { name }   200 { group: CommunityGroup }
 *
 * Remplace, pour l'app, /api/gamification/groups : meme table, mais aucun email
 * dans la reponse, un code court (6 caracteres) qu'on peut dicter, et un
 * objet `group` a plat que l'app lit sans deviner la forme.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SHARE_BASE_URL, generateUniqueCode } from "@/lib/community"

export const dynamic = "force-dynamic"

const MAX_GROUP_NAME = 60
const MAX_GROUPS_CREATED = 20

function toGroup(g: { id: string; name: string; inviteCode: string; createdBy: string; _count: { members: number } }, meId: string) {
  return {
    id: g.id,
    name: g.name,
    code: g.inviteCode,
    shareUrl: `${SHARE_BASE_URL}/${g.inviteCode}`,
    memberCount: g._count.members,
    isCreator: g.createdBy === meId,
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    const memberships = await prisma.leaderboardGroupMember.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: "asc" },
      select: {
        group: { select: { id: true, name: true, inviteCode: true, createdBy: true, _count: { select: { members: true } } } },
      },
    })
    return NextResponse.json({ groups: memberships.map((m) => toGroup(m.group, user.id)) })
  } catch (error) {
    console.error("[community/groups GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    const body = await req.json().catch(() => null)
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_GROUP_NAME) : ""
    if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 })

    const created = await prisma.leaderboardGroup.count({ where: { createdBy: user.id } })
    if (created >= MAX_GROUPS_CREATED) return NextResponse.json({ error: "too_many_groups" }, { status: 400 })

    const group = await prisma.leaderboardGroup.create({
      data: {
        name,
        createdBy: user.id,
        inviteCode: await generateUniqueCode(),
        members: { create: { userId: user.id } },
      },
      select: { id: true, name: true, inviteCode: true, createdBy: true, _count: { select: { members: true } } },
    })
    return NextResponse.json({ group: toGroup(group, user.id) })
  } catch (error) {
    console.error("[community/groups POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
