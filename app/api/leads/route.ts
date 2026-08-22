import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Capture d'email des pages publiques.
 *
 * Pourquoi cette route existe : jusqu'ici, un visiteur qui voyait la page et
 * n'installait pas l'app dans la minute etait perdu definitivement. Ca couvre
 * les utilisateurs Android, tout le trafic ordinateur, et ceux qui veulent y
 * reflechir. Mesure du 22 aout : 4 740 vues TikTok sur sept jours ont produit
 * 43 impressions App Store et 0 telechargement.
 *
 * Volontairement non authentifiee et sans effet de bord autre qu'une ligne en
 * base. Idempotente : reposter le meme email met a jour la ligne au lieu d'en
 * creer une seconde, donc un double clic ne pollue pas la liste.
 */

/** Validation volontairement permissive : on refuse les saisies manifestement
 *  fausses, pas les adresses exotiques mais valides. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Bornes de securite : au-dela, c'est du bruit ou une tentative d'abus. */
const MAX_EMAIL_LENGTH = 254
const MAX_SOURCE_LENGTH = 64

/** Sources acceptees. Une valeur inconnue retombe sur "inconnu" plutot que
 *  d'etre ecrite telle quelle, pour que la colonne reste exploitable. */
const KNOWN_SOURCES = new Set(["mode-examen", "product-hunt", "accueil"])

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide" }, { status: 400 })
  }

  const { email, source, website } = (body ?? {}) as {
    email?: unknown
    source?: unknown
    website?: unknown
  }

  // Piege a robots : le champ `website` est masque dans le formulaire, donc un
  // humain ne le remplit jamais. On repond 200 pour ne rien apprendre au bot.
  if (typeof website === "string" && website.trim() !== "") {
    return NextResponse.json({ ok: true })
  }

  if (typeof email !== "string") {
    return NextResponse.json({ error: "Email requis" }, { status: 400 })
  }

  const normalized = email.trim().toLowerCase()

  if (normalized.length === 0 || normalized.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(normalized)) {
    return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 })
  }

  const rawSource = typeof source === "string" ? source.trim().slice(0, MAX_SOURCE_LENGTH) : ""
  const resolvedSource = KNOWN_SOURCES.has(rawSource) ? rawSource : "inconnu"

  try {
    await prisma.lead.upsert({
      where: { email: normalized },
      // On ne remplace pas la source d'origine : la premiere page qui a capte
      // l'adresse est l'information utile, pas la derniere.
      update: {},
      create: { email: normalized, source: resolvedSource },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[leads] echec de l'enregistrement", error)
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 })
  }
}
