import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canManageQrLinks } from "@/lib/qr-admin-auth"

export const dynamic = "force-dynamic"

function normalizeOptionalString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined
  const normalized = value.trim()
  return normalized ? normalized.slice(0, maxLength) : null
}

function normalizeUrl(value: unknown) {
  if (value === undefined) return undefined
  if (typeof value !== "string") return null

  try {
    const url = new URL(value.trim())
    if (!["https:", "http:"].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

function serializeLink(link: {
  id: string
  slug: string
  targetUrl: string
  label: string | null
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count?: { scans: number }
}) {
  return {
    id: link.id,
    slug: link.slug,
    shortUrl: `/r/${link.slug}`,
    targetUrl: link.targetUrl,
    label: link.label,
    description: link.description,
    isActive: link.isActive,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    scanCount: link._count?.scans,
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  if (!(await canManageQrLinks(request))) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const { slug } = await context.params
  const normalizedSlug = decodeURIComponent(slug).trim().toLowerCase()

  const link = await prisma.qrRedirect.findUnique({
    where: { slug: normalizedSlug },
    include: {
      _count: {
        select: { scans: true },
      },
    },
  })

  if (!link) {
    return NextResponse.json({ error: "Lien introuvable" }, { status: 404 })
  }

  const recentScans = await prisma.qrRedirectScan.findMany({
    where: { qrRedirectId: link.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      referer: true,
      userAgent: true,
      destination: true,
      query: true,
    },
  })

  return NextResponse.json({
    link: serializeLink(link),
    recentScans,
  })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  if (!(await canManageQrLinks(request))) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const { slug } = await context.params
  const normalizedSlug = decodeURIComponent(slug).trim().toLowerCase()

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide" }, { status: 400 })
  }

  const payload = (body ?? {}) as Record<string, unknown>
  const targetUrl = normalizeUrl(payload.targetUrl)

  if (targetUrl === null) {
    return NextResponse.json({ error: "targetUrl doit etre une URL http(s) valide" }, { status: 400 })
  }

  const data = {
    ...(targetUrl !== undefined ? { targetUrl } : {}),
    ...(payload.label !== undefined ? { label: normalizeOptionalString(payload.label, 120) } : {}),
    ...(payload.description !== undefined
      ? { description: normalizeOptionalString(payload.description, 500) }
      : {}),
    ...(typeof payload.isActive === "boolean" ? { isActive: payload.isActive } : {}),
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ a mettre a jour" }, { status: 400 })
  }

  try {
    const link = await prisma.qrRedirect.update({
      where: { slug: normalizedSlug },
      data,
      include: {
        _count: {
          select: { scans: true },
        },
      },
    })

    return NextResponse.json({ link: serializeLink(link) })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Lien introuvable" }, { status: 404 })
    }

    console.error("[qr_links] mise a jour impossible", error)
    return NextResponse.json({ error: "Mise a jour impossible" }, { status: 500 })
  }
}
