import { buildTikTokAttributionLinks } from "../lib/tiktok-attribution-links"

function readArg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  return process.argv.find(arg => arg.startsWith(prefix))?.slice(prefix.length) || fallback
}

function readNumberArg(name: string, fallback: number): number {
  const parsed = Number(readArg(name, String(fallback)))
  return Number.isFinite(parsed) ? parsed : fallback
}

const campaign = readArg("campaign", "vague2")
const placement = readArg("placement", "lead_form")
const format = readArg("format", "markdown")
const from = readNumberArg("from", 10)
const to = readNumberArg("to", 30)

const links = buildTikTokAttributionLinks({ campaign, placement, from, to })

if (format === "csv") {
  console.log("creative,campaign,placement,onelink,landing_url,deep_link")
  for (const link of links) {
    console.log([
      link.creativeCode,
      link.campaign,
      link.placement,
      link.oneLinkUrl,
      link.landingUrl,
      link.deepLinkUrl,
    ].map(value => `"${value.replaceAll('"', '""')}"`).join(","))
  }
} else {
  console.log(`| Créa | Campagne | Placement | OneLink | Landing |`)
  console.log(`| --- | --- | --- | --- | --- |`)
  for (const link of links) {
    console.log(`| ${link.creativeCode} | ${link.campaign} | ${link.placement} | ${link.oneLinkUrl} | ${link.landingUrl} |`)
  }
}
