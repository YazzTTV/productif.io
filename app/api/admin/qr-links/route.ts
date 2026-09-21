import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canManageQrLinks } from "@/lib/qr-admin-auth"

export const dynamic = "force-dynamic"

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,80}[a-z0-9]$/

function normalizeSlug(value: unknown) {
  if (typeof value !== "string") return null
  return value.trim().toLowerCase()
}

function normalizeOptionalString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized ? normalized.slice(0, maxLength) : null
}

function normalizeUrl(value: unknown) {
  if (typeof value !== "string") return null

  try {
    const url = new URL(value.trim())
    if (!["https:", "http:"].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  if (!(await canManageQrLinks(request))) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const links = await prisma.qrRedirect.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { scans: true },
      },
    },
  })

  return NextResponse.json({
    links: links.map((link) => ({
      id: link.id,
      slug: link.slug,
      shortUrl: `/r/${link.slug}`,
      targetUrl: link.targetUrl,
      label: link.label,
      description: link.description,
      isActive: link.isActive,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      scanCount: link._count.scans,
    })),
  })
}

export async function POST(request: NextRequest) {
  if (!(await canManageQrLinks(request))) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide" }, { status: 400 })
  }

  const payload = (body ?? {}) as Record<string, unknown>
  const slug = normalizeSlug(payload.slug)
  const targetUrl = normalizeUrl(payload.targetUrl)

  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Slug invalide. Utilise 3 a 82 caracteres: lettres, chiffres et tirets." },
      { status: 400 }
    )
  }

  if (!targetUrl) {
    return NextResponse.json({ error: "targetUrl doit etre une URL http(s) valide" }, { status: 400 })
  }

  try {
    const link = await prisma.qrRedirect.create({
      data: {
        slug,
        targetUrl,
        label: normalizeOptionalString(payload.label, 120),
        description: normalizeOptionalString(payload.description, 500),
        isActive: typeof payload.isActive === "boolean" ? payload.isActive : true,
      },
    })

    return NextResponse.json(
      {
        id: link.id,
        slug: link.slug,
        shortUrl: `/r/${link.slug}`,
        targetUrl: link.targetUrl,
        label: link.label,
        description: link.description,
        isActive: link.isActive,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ce slug existe deja" }, { status: 409 })
    }

    console.error("[qr_links] creation impossible", error)
    return NextResponse.json({ error: "Creation impossible" }, { status: 500 })
  }
}
