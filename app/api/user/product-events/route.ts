import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const ALLOWED_EVENTS = new Set([
  "paywall_viewed",
  "paywall_dismissed",
  "purchase_completed",
  "purchase_restored",
])

function sanitizeParams(value: unknown): Record<string, string | number | boolean | null> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined

  const output: Record<string, string | number | boolean | null> = {}
  for (const [key, rawValue] of Object.entries(value)) {
    const cleanKey = key.trim().slice(0, 80)
    if (!cleanKey) continue
    if (
      typeof rawValue === "string" ||
      typeof rawValue === "number" ||
      typeof rawValue === "boolean" ||
      rawValue === null
    ) {
      output[cleanKey] = typeof rawValue === "string" ? rawValue.slice(0, 500) : rawValue
    }
  }

  return Object.keys(output).length > 0 ? output : undefined
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await req.json()
    const eventName = typeof body.eventName === "string" ? body.eventName.trim() : ""
    if (!ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ error: "Event non autorisé" }, { status: 400 })
    }

    await prisma.productAnalyticsEvent.create({
      data: {
        userId: user.id,
        eventName,
        params: sanitizeParams(body.params),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[product-events] Erreur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
