import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { isUserAdmin } from "@/lib/admin-utils"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const DAY_MS = 24 * 60 * 60 * 1000
const PREMIUM_STATUSES = ["active", "trialing", "paid"]
const PREMIUM_TIERS = ["starter", "pro", "premium", "enterprise", "paid"]

function parseDays(req: NextRequest): number {
  const value = Number(req.nextUrl.searchParams.get("days") || 30)
  if (!Number.isFinite(value)) return 30
  return Math.max(1, Math.min(Math.floor(value), 365))
}

function isPremiumUser(user: {
  subscriptionStatus: string | null
  subscriptionTier: string | null
  stripeSubscriptionId: string | null
}) {
  return (
    !!user.stripeSubscriptionId ||
    (user.subscriptionStatus ? PREMIUM_STATUSES.includes(user.subscriptionStatus) : false) ||
    (user.subscriptionTier ? PREMIUM_TIERS.includes(user.subscriptionTier) : false)
  )
}

function readAttributionValue(data: unknown, keys: string[]): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const record = data as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req)
    if (!authUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const isSuperAdmin = await isUserAdmin(authUser.id, true)
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const days = parseDays(req)
    const since = new Date(Date.now() - days * DAY_MS)

    const attributedWhere = {
      createdAt: { gte: since },
      OR: [
        { attributedAt: { not: null } },
        { attributionSource: { not: null } },
        { referredBy: { not: null } },
      ],
    }

    const [
      totalUsers,
      leads,
      attributedUsers,
      recentUsers,
      rawGroupedRows,
      rawDailyRows,
      rawEventRows,
      rawEventTotals,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.lead.count({ where: { createdAt: { gte: since } } }),
      prisma.user.findMany({
        where: attributedWhere,
        select: {
          subscriptionStatus: true,
          subscriptionTier: true,
          stripeSubscriptionId: true,
          attributionSource: true,
        },
      }),
      prisma.user.findMany({
        where: attributedWhere,
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          email: true,
          createdAt: true,
          attributedAt: true,
          referredBy: true,
          attributionSource: true,
          attributionProvider: true,
          attributionData: true,
          subscriptionStatus: true,
          subscriptionTier: true,
          stripeSubscriptionId: true,
        },
      }),
      prisma.$queryRaw<
        {
          source: string | null
          provider: string | null
          campaign: string | null
          creative: string | null
          placement: string | null
          users: number
          premiumUsers: number
          firstSignupAt: Date | null
          lastSignupAt: Date | null
        }[]
      >`
        SELECT
          COALESCE("attributionSource", 'unknown') AS "source",
          COALESCE("attributionProvider", 'unknown') AS "provider",
          COALESCE("attributionData"->>'campaign', 'unknown') AS "campaign",
          COALESCE(
            "attributionData"->>'af_sub2',
            "attributionData"->>'utm_content',
            "attributionData"->>'af_ad',
            'unknown'
          ) AS "creative",
          COALESCE("attributionData"->>'af_sub3', 'unknown') AS "placement",
          COUNT(*)::int AS "users",
          COUNT(*) FILTER (
            WHERE "stripeSubscriptionId" IS NOT NULL
              OR "subscriptionStatus" IN ('active', 'trialing', 'paid')
              OR "subscriptionTier" IN ('starter', 'pro', 'premium', 'enterprise', 'paid')
          )::int AS "premiumUsers",
          MIN("createdAt") AS "firstSignupAt",
          MAX("createdAt") AS "lastSignupAt"
        FROM "User"
        WHERE "createdAt" >= ${since}
          AND ("attributedAt" IS NOT NULL OR "attributionSource" IS NOT NULL OR "referredBy" IS NOT NULL)
        GROUP BY 1, 2, 3, 4, 5
        ORDER BY "users" DESC, "lastSignupAt" DESC
      `,
      prisma.$queryRaw<
        {
          day: Date
          signups: number
          attributedUsers: number
          tiktokUsers: number
          premiumUsers: number
        }[]
      >`
        SELECT
          date_trunc('day', "createdAt")::date AS "day",
          COUNT(*)::int AS "signups",
          COUNT(*) FILTER (
            WHERE "attributedAt" IS NOT NULL OR "attributionSource" IS NOT NULL OR "referredBy" IS NOT NULL
          )::int AS "attributedUsers",
          COUNT(*) FILTER (
            WHERE "attributionSource" = 'tiktok_organic'
          )::int AS "tiktokUsers",
          COUNT(*) FILTER (
            WHERE "stripeSubscriptionId" IS NOT NULL
              OR "subscriptionStatus" IN ('active', 'trialing', 'paid')
              OR "subscriptionTier" IN ('starter', 'pro', 'premium', 'enterprise', 'paid')
          )::int AS "premiumUsers"
        FROM "User"
        WHERE "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1 DESC
      `,
      prisma.$queryRaw<
        {
          source: string | null
          provider: string | null
          campaign: string | null
          creative: string | null
          placement: string | null
          paywallViews: number
          paywallDismisses: number
          purchases: number
          restores: number
        }[]
      >`
        SELECT
          COALESCE(u."attributionSource", 'unknown') AS "source",
          COALESCE(u."attributionProvider", 'unknown') AS "provider",
          COALESCE(u."attributionData"->>'campaign', 'unknown') AS "campaign",
          COALESCE(
            u."attributionData"->>'af_sub2',
            u."attributionData"->>'utm_content',
            u."attributionData"->>'af_ad',
            'unknown'
          ) AS "creative",
          COALESCE(u."attributionData"->>'af_sub3', 'unknown') AS "placement",
          COUNT(*) FILTER (WHERE pae."eventName" = 'paywall_viewed')::int AS "paywallViews",
          COUNT(*) FILTER (WHERE pae."eventName" = 'paywall_dismissed')::int AS "paywallDismisses",
          COUNT(*) FILTER (WHERE pae."eventName" = 'purchase_completed')::int AS "purchases",
          COUNT(*) FILTER (WHERE pae."eventName" = 'purchase_restored')::int AS "restores"
        FROM "product_analytics_events" pae
        JOIN "User" u ON u."id" = pae."userId"
        WHERE pae."createdAt" >= ${since}
        GROUP BY 1, 2, 3, 4, 5
      `,
      prisma.$queryRaw<
        {
          paywallViews: number
          paywallDismisses: number
          purchases: number
          restores: number
        }[]
      >`
        SELECT
          COUNT(*) FILTER (WHERE "eventName" = 'paywall_viewed')::int AS "paywallViews",
          COUNT(*) FILTER (WHERE "eventName" = 'paywall_dismissed')::int AS "paywallDismisses",
          COUNT(*) FILTER (WHERE "eventName" = 'purchase_completed')::int AS "purchases",
          COUNT(*) FILTER (WHERE "eventName" = 'purchase_restored')::int AS "restores"
        FROM "product_analytics_events"
        WHERE "createdAt" >= ${since}
      `,
    ])

    const premiumAttributedUsers = attributedUsers.filter(isPremiumUser).length
    const tiktokAttributedUsers = attributedUsers.filter(user => user.attributionSource === "tiktok_organic").length

    const eventRowsByGroup = new Map(
      rawEventRows.map(row => [
        [row.source, row.provider, row.campaign, row.creative, row.placement].join("|"),
        {
          paywallViews: Number(row.paywallViews),
          paywallDismisses: Number(row.paywallDismisses),
          purchases: Number(row.purchases),
          restores: Number(row.restores),
        },
      ]),
    )

    const groupedRows = rawGroupedRows.map(row => {
      const eventRows = eventRowsByGroup.get(
        [row.source, row.provider, row.campaign, row.creative, row.placement].join("|"),
      ) || {
        paywallViews: 0,
        paywallDismisses: 0,
        purchases: 0,
        restores: 0,
      }

      return {
      ...row,
      users: Number(row.users),
      premiumUsers: Number(row.premiumUsers),
      ...eventRows,
      conversionRate: row.users > 0 ? Number(((Number(row.premiumUsers) / Number(row.users)) * 100).toFixed(1)) : 0,
      firstSignupAt: row.firstSignupAt?.toISOString() || null,
      lastSignupAt: row.lastSignupAt?.toISOString() || null,
      }
    })

    for (const row of rawEventRows) {
      const key = [row.source, row.provider, row.campaign, row.creative, row.placement].join("|")
      if (groupedRows.some(group => [group.source, group.provider, group.campaign, group.creative, group.placement].join("|") === key)) {
        continue
      }

      groupedRows.push({
        source: row.source,
        provider: row.provider,
        campaign: row.campaign,
        creative: row.creative,
        placement: row.placement,
        users: 0,
        premiumUsers: 0,
        paywallViews: Number(row.paywallViews),
        paywallDismisses: Number(row.paywallDismisses),
        purchases: Number(row.purchases),
        restores: Number(row.restores),
        conversionRate: 0,
        firstSignupAt: null,
        lastSignupAt: null,
      })
    }

    const dailyRows = rawDailyRows.map(row => ({
      day: row.day.toISOString().slice(0, 10),
      signups: Number(row.signups),
      attributedUsers: Number(row.attributedUsers),
      tiktokUsers: Number(row.tiktokUsers),
      premiumUsers: Number(row.premiumUsers),
    }))

    const users = recentUsers.map(user => {
      const campaign = readAttributionValue(user.attributionData, ["campaign", "c"])
      const creative = readAttributionValue(user.attributionData, ["af_sub2", "utm_content", "af_ad"])
      const placement = readAttributionValue(user.attributionData, ["af_sub3", "placement"])

      return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        attributedAt: user.attributedAt?.toISOString() || null,
        source: user.attributionSource || "unknown",
        provider: user.attributionProvider || "unknown",
        referredBy: user.referredBy,
        campaign,
        creative,
        placement,
        subscriptionStatus: user.subscriptionStatus || "free",
        isPremium: isPremiumUser(user),
      }
    })

    return NextResponse.json({
      days,
      since: since.toISOString(),
      totals: {
        signups: totalUsers,
        leads,
        attributedUsers: attributedUsers.length,
        tiktokAttributedUsers,
        premiumAttributedUsers,
        paywallViews: Number(rawEventTotals[0]?.paywallViews || 0),
        paywallDismisses: Number(rawEventTotals[0]?.paywallDismisses || 0),
        purchases: Number(rawEventTotals[0]?.purchases || 0),
        restores: Number(rawEventTotals[0]?.restores || 0),
        attributionRate: totalUsers > 0 ? Number(((attributedUsers.length / totalUsers) * 100).toFixed(1)) : 0,
        premiumRate: attributedUsers.length > 0 ? Number(((premiumAttributedUsers / attributedUsers.length) * 100).toFixed(1)) : 0,
      },
      groups: groupedRows,
      daily: dailyRows,
      users,
      notes: {},
    })
  } catch (error) {
    console.error("[admin/acquisition] Erreur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
