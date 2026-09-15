import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sessionSchema } from "@/lib/study-analysis/validation";
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = sessionSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    const s = parsed.data;
    if (s.clientId.startsWith("exam_demo_"))
      return NextResponse.json({ error: "Demo excluded" }, { status: 400 });
    if (
      s.serverSessionId &&
      !(await prisma.deepWorkSession.findFirst({
        where: { id: s.serverSessionId, userId: user.id },
        select: { id: true },
      }))
    )
      return NextResponse.json(
        { error: "Invalid linked session" },
        { status: 400 },
      );
    const ids = [
      ...new Set(
        s.segments.map((x) => x.taskId).filter((id): id is string => !!id),
      ),
    ];
    const owned = await prisma.task.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((t) => t.id));
    // Deleted tasks keep their time, but no attribution. Never trust a foreign task identifier.
    const segments = s.segments.map((x) => ({
      start: x.start,
      end: x.end,
      ...(x.taskId && ownedIds.has(x.taskId) ? { taskId: x.taskId } : {}),
    }));
    const data = {
      ...s,
      userId: user.id,
      startedAt: new Date(s.startedAt),
      endedAt: s.endedAt ? new Date(s.endedAt) : null,
      segments,
    };
    await prisma.$transaction(async (tx) => {
      await tx.studySession.createMany({ data: [data], skipDuplicates: true });
      await tx.studySession.updateMany({
        where: {
          userId: user.id,
          clientId: s.clientId,
          revision: { lt: s.revision },
          source: s.source,
          startedAt: data.startedAt,
        },
        data,
      });
    });
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("[study-analysis] session save failed", error);
    return NextResponse.json({ error: "Save unavailable" }, { status: 503 });
  }
}
