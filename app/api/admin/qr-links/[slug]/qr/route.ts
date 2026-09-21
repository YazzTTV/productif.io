import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { prisma } from "@/lib/prisma"
import { canManageQrLinks } from "@/lib/qr-admin-auth"

export const dynamic = "force-dynamic"

function getBaseUrl(request: NextRequest) {
  const explicitBaseUrl = request.nextUrl.searchParams.get("baseUrl")

  if (explicitBaseUrl) {
    try {
      const parsed = new URL(explicitBaseUrl)
      if (["https:", "http:"].includes(parsed.protocol)) {
        return parsed.origin
      }
    } catch {
      return null
    }
  }

  return request.nextUrl.origin
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
  const baseUrl = getBaseUrl(request)

  if (!baseUrl) {
    return NextResponse.json({ error: "baseUrl invalide" }, { status: 400 })
  }

  const link = await prisma.qrRedirect.findUnique({
    where: { slug: normalizedSlug },
    select: { slug: true },
  })

  if (!link) {
    return NextResponse.json({ error: "Lien introuvable" }, { status: 404 })
  }

  const shortUrl = new URL(`/r/${link.slug}`, baseUrl).toString()
  const svg = await QRCode.toString(shortUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 1024,
  })

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="${link.slug}.svg"`,
    },
  })
}
