import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, subDays } from "date-fns"

export async function GET(req: Request) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const weekStart = startOfDay(subDays(now, 7))

    // 1. Deep Work d'aujourd'hui
    const todayDeepWork = await prisma.$queryRaw<Array<{ total_hours: number; sessions: number }>>`
      SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM (te."endTime" - te."startTime"))/3600), 0) as total_hours,
        COUNT(*)::int as sessions
      FROM "DeepWorkSession" dws
      JOIN "TimeEntry" te ON te.id = dws."timeEntryId"
      WHERE dws."userId" = ${user.id}
        AND dws.status = 'completed'
        AND te."endTime" IS NOT NULL
        AND te."startTime" >= ${todayStart}
        AND te."startTime" <= ${todayEnd}
    `

    // 2. Deep Work des 7 derniers jours
    const weekDeepWork = await prisma.$queryRaw<Array<{ total_hours: number; sessions: number }>>`
      SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM (te."endTime" - te."startTime"))/3600), 0) as total_hours,
        COUNT(*)::int as sessions
      FROM "DeepWorkSession" dws
      JOIN "TimeEntry" te ON te.id = dws."timeEntryId"
      WHERE dws."userId" = ${user.id}
        AND dws.status = 'completed'
        AND te."endTime" IS NOT NULL
        AND te."startTime" >= ${weekStart}
    `

    // 3. Deep Work total (toutes les sessions complétées)
    const allTimeDeepWork = await prisma.$queryRaw<Array<{ total_hours: number; sessions: number }>>`
      SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM (te."endTime" - te."startTime"))/3600), 0) as total_hours,
        COUNT(*)::int as sessions
      FROM "DeepWorkSession" dws
      JOIN "TimeEntry" te ON te.id = dws."timeEntryId"
      WHERE dws."userId" = ${user.id}
        AND dws.status = 'completed'
        AND te."endTime" IS NOT NULL
    `

    // 4. Meilleure session (la plus longue)
    const bestSession = await prisma.$queryRaw<Array<{ duration_seconds: number }>>`
      SELECT 
        EXTRACT(EPOCH FROM (te."endTime" - te."startTime")) as duration_seconds
      FROM "DeepWorkSession" dws
      JOIN "TimeEntry" te ON te.id = dws."timeEntryId"
      WHERE dws."userId" = ${user.id}
        AND dws.status = 'completed'
        AND te."endTime" IS NOT NULL
      ORDER BY duration_seconds DESC
      LIMIT 1
    `

    const todayHours = Number(todayDeepWork[0]?.total_hours || 0)
    const weekHours = Number(weekDeepWork[0]?.total_hours || 0)
    const allTimeHours = Number(allTimeDeepWork[0]?.total_hours || 0)
    const bestSessionSeconds = Number(bestSession[0]?.duration_seconds || 0)

    let bestSessionFormatted = 'N/A'
    if (bestSessionSeconds > 0) {
      const hours = Math.floor(bestSessionSeconds / 3600)
      const minutes = Math.floor((bestSessionSeconds % 3600) / 60)
      if (hours > 0) {
        bestSessionFormatted = `${hours}h ${minutes}m`
      } else {
        bestSessionFormatted = `${minutes}m`
      }
    }

    return NextResponse.json({
      today: {
        hours: todayHours,
        seconds: Math.round(todayHours * 3600),
      },
      week: {
        hours: weekHours,
        seconds: Math.round(weekHours * 3600),
      },
      allTime: {
        hours: allTimeHours,
        seconds: Math.round(allTimeHours * 3600),
      },
      bestSession: bestSessionFormatted,
      bestSessionSeconds: bestSessionSeconds,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des stats de deep work:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}

