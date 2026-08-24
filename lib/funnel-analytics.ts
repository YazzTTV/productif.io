"use client"

import { track } from "@vercel/analytics"

type FunnelProps = Record<string, string | number | boolean | null>

const DEFAULT_ONELINK_URL = "https://productif.onelink.me/HCEk"

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
] as const

function readSearchParam(key: string): string | null {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get(key)
}

function cleanParam(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function normalizeMediaSource(value: string | null, medium: string | null): string {
  const source = cleanParam(value)?.toLowerCase().replace(/[^a-z0-9_.-]+/g, "_")
  const channel = cleanParam(medium)?.toLowerCase()

  if (!source) return "productif_web"
  if (source === "tiktok" && (!channel || channel === "organic")) return "tiktok_organic"
  if (source === "instagram" && (!channel || channel === "organic")) return "instagram_organic"

  return source.slice(0, 100)
}

export function getFunnelProps(extra: FunnelProps = {}): FunnelProps {
  const props: FunnelProps = {
    path: typeof window === "undefined" ? null : window.location.pathname,
  }

  for (const key of ATTRIBUTION_KEYS) {
    props[key] = readSearchParam(key)
  }

  return { ...props, ...extra }
}

export function trackFunnelEvent(name: string, props: FunnelProps = {}) {
  track(name, getFunnelProps(props))
}

export function getAttributedAppUrl({
  placement,
  fallbackAppStoreUrl,
}: {
  placement: string
  fallbackAppStoreUrl?: string
}): string {
  const oneLinkUrl = process.env.NEXT_PUBLIC_APPSFLYER_ONELINK_URL || DEFAULT_ONELINK_URL
  const url = new URL(oneLinkUrl)

  const source = readSearchParam("utm_source")
  const medium = readSearchParam("utm_medium")
  const campaign = readSearchParam("utm_campaign") || "mode_examen"
  const content = readSearchParam("utm_content")
  const term = readSearchParam("utm_term")
  const ref = readSearchParam("ref")
  const path = typeof window === "undefined" ? "/mode-examen" : window.location.pathname

  const mediaSource = normalizeMediaSource(source, medium)

  url.searchParams.set("pid", mediaSource)
  url.searchParams.set("c", campaign)
  url.searchParams.set("af_channel", medium || "landing")
  url.searchParams.set("deep_link_value", "mode_examen")
  url.searchParams.set("deep_link_sub1", source || mediaSource)
  url.searchParams.set("deep_link_sub2", campaign)
  url.searchParams.set("deep_link_sub3", content || placement)
  url.searchParams.set("af_sub2", content || campaign)
  url.searchParams.set("af_sub3", placement)
  url.searchParams.set("af_sub4", path)

  if (content) url.searchParams.set("af_ad", content)
  if (term) url.searchParams.set("af_keywords", term)
  if (ref) url.searchParams.set("af_sub1", ref)
  if (fallbackAppStoreUrl) url.searchParams.set("af_ios_url", fallbackAppStoreUrl)

  const deepLinkParams = new URLSearchParams({
    media_source: mediaSource,
    campaign,
    af_channel: medium || "landing",
    af_sub2: content || campaign,
    af_sub3: placement,
  })

  if (content) deepLinkParams.set("utm_content", content)
  if (ref) deepLinkParams.set("af_sub1", ref)

  url.searchParams.set("af_dp", `productifio://mode-examen?${deepLinkParams.toString()}`)

  return url.toString()
}
