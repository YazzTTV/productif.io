import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const DEFAULT_TARGET_BASE_URL = "https://productif.io/mode-examen"
const DEFAULT_PUBLIC_BASE_URL = "https://productif.io"
const CAMPAIGN = "montpellier-campus"

const links = [
  {
    slug: "montpellier-bu-richter",
    label: "Affiche Montpellier - BU Richter",
    description: "QR dynamique pour les affiches placees a la BU Richter.",
  },
  {
    slug: "montpellier-bu-sciences",
    label: "Affiche Montpellier - BU Sciences",
    description: "QR dynamique pour les affiches placees a la BU Sciences.",
  },
  {
    slug: "montpellier-bu-triolet",
    label: "Affiche Montpellier - BU Triolet",
    description: "QR dynamique pour les affiches placees a la BU Triolet.",
  },
  {
    slug: "montpellier-fac-moma",
    label: "Affiche Montpellier - Fac MOMA",
    description: "QR dynamique pour les affiches placees a la fac MOMA.",
  },
  {
    slug: "montpellier-fac-eco",
    label: "Affiche Montpellier - Fac Eco",
    description: "QR dynamique pour les affiches placees a la fac d'economie.",
  },
  {
    slug: "montpellier-fac-medecine",
    label: "Affiche Montpellier - Fac Medecine",
    description: "QR dynamique pour les affiches placees a la fac de medecine.",
  },
  {
    slug: "montpellier-fac-droit",
    label: "Affiche Montpellier - Fac Droit",
    description: "QR dynamique pour les affiches placees a la fac de droit.",
  },
]

function buildTargetUrl(slug: string) {
  const targetBaseUrl = process.env.QR_TARGET_BASE_URL || DEFAULT_TARGET_BASE_URL
  const url = new URL(targetBaseUrl)

  url.searchParams.set("utm_source", "qr")
  url.searchParams.set("utm_medium", "offline")
  url.searchParams.set("utm_campaign", CAMPAIGN)
  url.searchParams.set("utm_content", slug)

  return url.toString()
}

async function main() {
  const publicBaseUrl = process.env.QR_PUBLIC_BASE_URL || DEFAULT_PUBLIC_BASE_URL

  console.log("Creation/mise a jour des liens QR Montpellier...")

  for (const link of links) {
    const targetUrl = buildTargetUrl(link.slug)

    await prisma.qrRedirect.upsert({
      where: { slug: link.slug },
      update: {
        targetUrl,
        label: link.label,
        description: link.description,
        isActive: true,
      },
      create: {
        slug: link.slug,
        targetUrl,
        label: link.label,
        description: link.description,
        isActive: true,
      },
    })

    console.log(`${link.label}: ${new URL(`/r/${link.slug}`, publicBaseUrl).toString()} -> ${targetUrl}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
