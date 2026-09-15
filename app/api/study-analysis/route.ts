import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { getPlanInfo } from "@/lib/plans";
import { validTimezone } from "@/lib/study-analysis/validation";
import { loadStudyAnalysis } from "@/lib/study-analysis/service";
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const params = req.nextUrl.searchParams;
    const days = Number(params.get("days") || 7);
    if (![7, 14, 30, 90].includes(days))
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    let timezone: string;
    try {
      timezone = validTimezone(params.get("timezone"));
    } catch {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
    }
    const allowed = getPlanInfo(user).limits.analyticsRetentionDays;
    if (allowed !== null && days > allowed)
      return NextResponse.json(
        { error: "Premium history", locked: true },
        { status: 403 },
      );
    return NextResponse.json(await loadStudyAnalysis(user, days, timezone), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[study-analysis] load failed", error);
    return NextResponse.json(
      { error: "Analysis unavailable" },
      { status: 503 },
    );
  }
}
