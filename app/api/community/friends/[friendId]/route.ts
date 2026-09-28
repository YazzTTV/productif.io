/**
 * DELETE /api/community/friends/:friendId
 *   200 { removed: true }
 *
 * Retire l'amitie dans les deux sens : l'autre ne voit plus non plus.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ friendId: string }> }) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    const { friendId } = await params
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: user.id, friendId },
          { userId: friendId, friendId: user.id },
        ],
      },
    })
    return NextResponse.json({ removed: true })
  } catch (error) {
    console.error("[community/friends DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
