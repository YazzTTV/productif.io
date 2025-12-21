import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeLevel } from "@/lib/xp";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const gamif = await prisma.userGamification.findUnique({
      where: { userId: user.id },
    });

    const totalXp = gamif?.totalXp || 0;
    const { level, nextLevelXp, xpIntoLevel, xpNeeded, progress } = computeLevel(totalXp);

    return NextResponse.json({
      xp: {
        totalXp,
        level,
        nextLevelXp,
        xpIntoLevel,
        xpNeeded,
        progress,
      },
    });
  } catch (error) {
    console.error("Erreur XP status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

