import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { verifyApiToken } from "@/lib/api-token"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, subDays } from "date-fns"

// Augmenter le timeout pour les requêtes complexes (60 secondes)
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const routeName = "[DEEPWORK_STATS]"
  
  try {
    console.log(`${routeName} ⏱️  DÉBUT - Route: /api/dashboard/deepwork-stats - Timestamp: ${new Date().toISOString()}`)
    
    // Essayer d'abord avec getAuthUserFromRequest (tokens utilisateur)
    let user = await getAuthUserFromRequest(req)
    
    // Si pas d'utilisateur, essayer avec un token API
    if (!user) {
      const authHeader = req.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7)
        try {
          const apiTokenPayload = await verifyApiToken(token)
          if (apiTokenPayload && apiTokenPayload.userId) {
            // Récupérer l'utilisateur depuis le token API
            user = await prisma.user.findUnique({
              where: { id: apiTokenPayload.userId }
            })
          }
        } catch (error) {
          // Si la vérification du token API échoue, on continue avec null
          // Cela permet de retourner une erreur 401 claire
          console.error("Erreur lors de la vérification du token API:", error)
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // OPTIMISATION: Vérification rapide si l'utilisateur a des sessions deep work
    const hasDeepWorkSessions = await prisma.deepWorkSession.count({
      where: { userId: user.id }
    }) > 0

    // Si pas de sessions, retourner une réponse vide rapidement
    if (!hasDeepWorkSessions) {
      return NextResponse.json({
        today: { hours: 0, seconds: 0 },
        week: { hours: 0, seconds: 0 },
        allTime: { hours: 0, seconds: 0 },
        bestSession: "N/A",
        bestSessionSeconds: 0
      })
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

    const totalTime = Date.now() - startTime
    console.log(`${routeName} ✅ SUCCÈS - Route terminée en ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)

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
    const totalTime = Date.now() - startTime
    console.error(`${routeName} ❌ ERREUR - Route échouée après ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)
    console.error("Erreur lors de la récupération des stats de deep work:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}

