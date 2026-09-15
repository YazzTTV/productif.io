import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkinSchema } from "@/lib/study-analysis/validation";
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = checkinSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid check-in" }, { status: 400 });
    const c = parsed.data;
    if (
      c.sessionId &&
      !(await prisma.studySession.findUnique({
        where: { userId_clientId: { userId: user.id, clientId: c.sessionId } },
      }))
    )
      return NextResponse.json(
        { error: "Session must be synchronized first" },
        { status: 409 },
      );
    await prisma.studyCheckIn.upsert({
      where: { userId_clientId: { userId: user.id, clientId: c.clientId } },
      create: { ...c, userId: user.id, timestamp: new Date(c.timestamp) },
      update: { value: c.value },
    });
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("[study-analysis] check-in save failed", error);
    return NextResponse.json({ error: "Save unavailable" }, { status: 503 });
  }
}
