import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeXpForEvent, computeLevel } from "@/lib/xp";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { type, payload = {} } = body;

    if (!type) {
      return NextResponse.json({ error: "type requis" }, { status: 400 });
    }

    const xpAwarded = computeXpForEvent(type, payload);
    if (xpAwarded <= 0) {
      return NextResponse.json({ error: "type d'événement non reconnu" }, { status: 400 });
    }

    const existing = await prisma.userGamification.findUnique({
      where: { userId: user.id },
    });

    const totalXp = (existing?.totalXp || 0) + xpAwarded;
    const { level, nextLevelXp } = computeLevel(totalXp);

    const updated = await prisma.userGamification.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        totalXp,
        level,
        nextLevelXp,
      },
      update: {
        totalXp,
        level,
        nextLevelXp,
      },
    });

    await prisma.xpEvent.create({
      data: {
        userId: user.id,
        type,
        xpAwarded,
        metadata: payload,
      },
    });

    return NextResponse.json({
      message: "XP ajouté",
      xpAwarded,
      totalXp: updated.totalXp,
      level: updated.level,
      nextLevelXp: updated.nextLevelXp,
    });
  } catch (error) {
    console.error("Erreur XP event:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

