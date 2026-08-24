export const DEFAULT_TIKTOK_ONELINK_URL = "https://productif.onelink.me/HCEk"
export const DEFAULT_PRODUCTIF_APP_STORE_URL = "https://apps.apple.com/fr/app/productif-io/id6755625569"
export const DEFAULT_PRODUCTIF_WEB_URL = "https://productif.io"

export type TikTokPlacement = "bio" | "lead_form" | "dm" | "comment" | "hero" | string

export interface TikTokAttributionLinkInput {
  creativeCode: string
  campaign?: string
  placement?: TikTokPlacement
  path?: string
  oneLinkUrl?: string
  webBaseUrl?: string
  appStoreUrl?: string
}

export interface TikTokAttributionLink {
  creativeCode: string
  campaign: string
  placement: string
  oneLinkUrl: string
  landingUrl: string
  deepLinkUrl: string
}

function cleanSegment(value: string, fallback: string): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_.-]+/g, "_")
  return cleaned || fallback
}

export function buildTikTokAttributionLink(input: TikTokAttributionLinkInput): TikTokAttributionLink {
  const creativeCode = cleanSegment(input.creativeCode, "C00").toUpperCase()
  const campaign = cleanSegment(input.campaign || "vague2", "vague2")
  const placement = cleanSegment(input.placement || "lead_form", "lead_form")
  const path = input.path || "/mode-examen"
  const oneLinkBase = input.oneLinkUrl || DEFAULT_TIKTOK_ONELINK_URL
  const webBaseUrl = input.webBaseUrl || DEFAULT_PRODUCTIF_WEB_URL
  const appStoreUrl = input.appStoreUrl || DEFAULT_PRODUCTIF_APP_STORE_URL

  const deepLinkParams = new URLSearchParams({
    media_source: "tiktok_organic",
    campaign,
    af_channel: "organic",
    af_sub2: creativeCode,
    af_sub3: placement,
    utm_content: creativeCode,
  })
  const deepLinkUrl = `productifio://mode-examen?${deepLinkParams.toString()}`

  const oneLink = new URL(oneLinkBase)
  oneLink.searchParams.set("pid", "tiktok_organic")
  oneLink.searchParams.set("c", campaign)
  oneLink.searchParams.set("af_channel", "organic")
  oneLink.searchParams.set("deep_link_value", "mode_examen")
  oneLink.searchParams.set("deep_link_sub1", "tiktok")
  oneLink.searchParams.set("deep_link_sub2", campaign)
  oneLink.searchParams.set("deep_link_sub3", creativeCode)
  oneLink.searchParams.set("af_sub2", creativeCode)
  oneLink.searchParams.set("af_sub3", placement)
  oneLink.searchParams.set("af_sub4", path)
  oneLink.searchParams.set("af_ad", creativeCode)
  oneLink.searchParams.set("af_ios_url", appStoreUrl)
  oneLink.searchParams.set("af_dp", deepLinkUrl)

  const landing = new URL(path, webBaseUrl)
  landing.searchParams.set("utm_source", "tiktok")
  landing.searchParams.set("utm_medium", "organic")
  landing.searchParams.set("utm_campaign", campaign)
  landing.searchParams.set("utm_content", creativeCode)

  return {
    creativeCode,
    campaign,
    placement,
    oneLinkUrl: oneLink.toString(),
    landingUrl: landing.toString(),
    deepLinkUrl,
  }
}

export function buildTikTokAttributionLinks({
  campaign = "vague2",
  placement = "lead_form",
  from = 10,
  to = 30,
}: {
  campaign?: string
  placement?: TikTokPlacement
  from?: number
  to?: number
} = {}): TikTokAttributionLink[] {
  const start = Math.max(1, Math.min(from, to))
  const end = Math.max(start, Math.max(from, to))

  return Array.from({ length: end - start + 1 }, (_, index) => {
    const code = `C${start + index}`
    return buildTikTokAttributionLink({ creativeCode: code, campaign, placement })
  })
}
