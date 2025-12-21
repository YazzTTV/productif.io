import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Simple défi hebdo : atteindre 500 XP sur 7 jours
const WEEKLY_TARGET_XP = 500;

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const xpEvents = await prisma.xpEvent.aggregate({
      _sum: { xpAwarded: true },
      where: {
        userId: user.id,
        createdAt: { gte: since },
      },
    });

    const currentXp = xpEvents._sum.xpAwarded || 0;
    const remainingXp = Math.max(0, WEEKLY_TARGET_XP - currentXp);
    const progress = Math.min(1, currentXp / WEEKLY_TARGET_XP);

    return NextResponse.json({
      challenge: {
        targetXp: WEEKLY_TARGET_XP,
        currentXp,
        remainingXp,
        progress,
        since,
      },
    });
  } catch (error) {
    console.error("Erreur weekly challenge XP:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

