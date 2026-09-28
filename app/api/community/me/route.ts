/**
 * GET /api/community/me
 *   200 { friendCode, shareUrl, name }
 *
 * Cree le code ami au premier appel. Le lien de partage ouvre une page web qui
 * renvoie vers l'app (si elle est installee) ou vers l'App Store.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { SHARE_BASE_URL, displayName, ensureFriendCode } from "@/lib/community"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const friendCode = await ensureFriendCode(user.id)
    return NextResponse.json({
      friendCode,
      shareUrl: `${SHARE_BASE_URL}/${friendCode}`,
      name: displayName(user.name),
    })
  } catch (error) {
    console.error("[community/me]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
