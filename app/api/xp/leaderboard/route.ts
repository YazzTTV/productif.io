import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as "weekly" | "all") || "weekly";
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

    if (range === "all") {
      const leaderboard = await prisma.userGamification.findMany({
        orderBy: { totalXp: "desc" },
        take: limit,
        select: {
          userId: true,
          totalXp: true,
          level: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({ leaderboard });
    }

    // Weekly leaderboard: sum xp events last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const grouped = await prisma.xpEvent.groupBy({
      by: ["userId"],
      where: {
        createdAt: { gte: since },
      },
      _sum: {
        xpAwarded: true,
      },
      orderBy: {
        _sum: {
          xpAwarded: "desc",
        },
      },
      take: limit,
    });

    const userIds = grouped.map((g) => g.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = grouped.map((g, idx) => ({
      rank: idx + 1,
      userId: g.userId,
      xp: g._sum.xpAwarded || 0,
      name: userMap.get(g.userId)?.name || userMap.get(g.userId)?.email || "User",
      email: userMap.get(g.userId)?.email || "",
    }));

    return NextResponse.json({ leaderboard, since });
  } catch (error) {
    console.error("Erreur leaderboard XP:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

