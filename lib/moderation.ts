/**
 * Moderation de la Communaute : filtre de texte sur les noms visibles des autres
 * (noms de groupe, pseudos du classement) et alerte email a chaque signalement.
 *
 * Le filtre est volontairement simple : une liste de mots, comparee apres
 * normalisation (minuscules, sans accents, chiffres usuels remplaces par des
 * lettres). Il bloque le gros du contenu offensant ; le reste passe par les
 * signalements, traites a la main sous 24 h.
 */

import { Resend } from "resend"

const BLOCKED_WORDS = [
  // francais
  "connard", "connasse", "salope", "salaud", "pute", "putain", "encule", "enculer",
  "batard", "pd", "pede", "tapette", "nique", "niquer", "ntm", "fdp", "bite", "couille",
  "chatte", "branleur", "negre", "bougnoule", "youpin", "nazi", "hitler", "viol", "violer",
  "suicide", "pedophile", "pedo",
  // anglais
  "fuck", "fucker", "shit", "bitch", "cunt", "dick", "pussy", "whore", "slut", "nigger",
  "nigga", "faggot", "fag", "retard", "rape", "porn", "porno", "sex",
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
}

/** Vrai si le texte contient un mot de la liste, en mot entier ou colle (« sale_con »). */
export function isObjectionable(text: string | null | undefined): boolean {
  if (!text) return false
  const normalized = normalize(text)
  const tokens = normalized.split(/[^a-z]+/).filter(Boolean)
  const squashed = tokens.join("")
  return BLOCKED_WORDS.some(
    (word) => tokens.includes(word) || (word.length >= 5 && squashed.includes(word)),
  )
}

export const REPORT_REASONS = ["inappropriate_name", "harassment", "spam", "other"] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

/** Alerte email a chaque signalement. N'echoue jamais : le signalement est deja en base. */
export async function sendReportAlert(report: {
  id: string
  reporterId: string
  targetUserId: string | null
  groupId: string | null
  reason: string
  targetLabel: string
}): Promise<void> {
  const to = process.env.MODERATION_EMAIL || process.env.ALERT_EMAIL || "n.lugagne@productif.io"
  if (!process.env.RESEND_API_KEY) {
    console.error("[moderation] RESEND_API_KEY manquant : signalement enregistre sans alerte", report.id)
    return
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.SCAN_FROM_EMAIL || "Productif <onboarding@resend.dev>",
      to,
      subject: `[Moderation] Signalement Communaute : ${report.reason}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 18px;">Nouveau signalement dans la Communaute</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #333;">
            <b>Cible :</b> ${escapeHtml(report.targetLabel)}<br />
            <b>Motif :</b> ${report.reason}<br />
            <b>Signale par :</b> ${report.reporterId}<br />
            <b>Signalement :</b> ${report.id}<br />
            <b>Quand :</b> ${new Date().toISOString()}
          </p>
          <p style="font-size: 13px; color: #555;">
            A traiter sous 24 h : renommer ou supprimer le groupe, ou masquer le compte, puis
            passer la ligne CommunityReport en status = 'resolved'.
          </p>
        </div>`,
    })
  } catch (error) {
    console.error("[moderation] alerte de signalement non envoyee", report.id, error)
  }
}
