import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  )
}

function hashIp(ip: string | null) {
  if (!ip) return null
  return createHash("sha256").update(ip).digest("hex")
}

function appendScanParams(targetUrl: string, request: NextRequest, slug: string) {
  const destination = new URL(targetUrl)
  const sourceParams = request.nextUrl.searchParams

  for (const [key, value] of sourceParams.entries()) {
    if (!destination.searchParams.has(key)) {
      destination.searchParams.append(key, value)
    }
  }

  if (!destination.searchParams.has("utm_source")) {
    destination.searchParams.set("utm_source", "qr")
  }

  if (!destination.searchParams.has("utm_medium")) {
    destination.searchParams.set("utm_medium", "offline")
  }

  if (!destination.searchParams.has("utm_campaign")) {
    destination.searchParams.set("utm_campaign", slug)
  }

  return destination
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const normalizedSlug = decodeURIComponent(slug).trim().toLowerCase()

  if (!normalizedSlug) {
    return NextResponse.redirect(new URL("/", request.url), 302)
  }

  const redirect = await prisma.qrRedirect.findUnique({
    where: { slug: normalizedSlug },
    select: {
      id: true,
      slug: true,
      targetUrl: true,
      isActive: true,
    },
  })

  if (!redirect || !redirect.isActive) {
    return NextResponse.redirect(new URL("/", request.url), 302)
  }

  let destination: URL

  try {
    destination = appendScanParams(redirect.targetUrl, request, redirect.slug)
  } catch (error) {
    console.error("[qr_redirect] URL cible invalide", { slug: normalizedSlug, error })
    return NextResponse.redirect(new URL("/", request.url), 302)
  }

  const query = Object.fromEntries(request.nextUrl.searchParams.entries())

  try {
    await prisma.qrRedirectScan.create({
      data: {
        qrRedirectId: redirect.id,
        referer: request.headers.get("referer"),
        userAgent: request.headers.get("user-agent"),
        ipHash: hashIp(getClientIp(request)),
        destination: destination.toString(),
        query: Object.keys(query).length > 0 ? query : undefined,
      },
    })
  } catch (error) {
    console.error("[qr_redirect] scan non enregistre", { slug: normalizedSlug, error })
  }

  return NextResponse.redirect(destination, 302)
}
