/**
 * POST /api/community/join { code }
 *   200 { type: 'friend', friend: { userId, name }, alreadyFriends }
 *   200 { type: 'group', group: { id, name, memberCount }, alreadyMember }
 *   400 { error: 'invalid_code' | 'own_code' }
 *   404 { error: 'not_found' }
 *
 * Un seul champ « J'ai un code » dans l'app : le code est cherche d'abord parmi
 * les codes amis, puis parmi les codes de groupe. Les deux espaces ne se
 * chevauchent pas (lib/community.ts generateUniqueCode). Idempotent : rejouer
 * le meme code (lien ouvert deux fois) ne cree rien de plus et repond 200.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { displayName, normalizeCode } from "@/lib/community"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const body = await req.json().catch(() => null)
    const code = normalizeCode(body?.code)
    if (!code) return NextResponse.json({ error: "invalid_code" }, { status: 400 })

    const owner = await prisma.user.findUnique({ where: { friendCode: code }, select: { id: true, name: true } })
    if (owner) {
      if (owner.id === user.id) return NextResponse.json({ error: "own_code" }, { status: 400 })
      const existing = await prisma.friendship.findUnique({
        where: { userId_friendId: { userId: user.id, friendId: owner.id } },
        select: { id: true },
      })
      await prisma.$transaction([
        prisma.friendship.upsert({
          where: { userId_friendId: { userId: user.id, friendId: owner.id } },
          create: { userId: user.id, friendId: owner.id },
          update: {},
        }),
        prisma.friendship.upsert({
          where: { userId_friendId: { userId: owner.id, friendId: user.id } },
          create: { userId: owner.id, friendId: user.id },
          update: {},
        }),
      ])
      return NextResponse.json({
        type: "friend",
        friend: { userId: owner.id, name: displayName(owner.name) },
        alreadyFriends: !!existing,
      })
    }

    const group = await prisma.leaderboardGroup.findUnique({ where: { inviteCode: code }, select: { id: true, name: true } })
    if (group) {
      const existing = await prisma.leaderboardGroupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: user.id } },
        select: { id: true },
      })
      if (!existing) {
        await prisma.leaderboardGroupMember.create({ data: { groupId: group.id, userId: user.id } }).catch(() => null)
      }
      const memberCount = await prisma.leaderboardGroupMember.count({ where: { groupId: group.id } })
      return NextResponse.json({
        type: "group",
        group: { id: group.id, name: group.name, memberCount },
        alreadyMember: !!existing,
      })
    }

    return NextResponse.json({ error: "not_found" }, { status: 404 })
  } catch (error) {
    console.error("[community/join]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
