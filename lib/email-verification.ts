import { randomBytes } from "crypto"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const DEFAULT_APP_URL = "https://www.productif.io"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL
const FROM_EMAIL = process.env.AUTH_FROM_EMAIL || process.env.SCAN_FROM_EMAIL || "Productif <onboarding@resend.dev>"

const TOKEN_BYTES = 32
const TOKEN_TTL_HOURS = 24
const BLOCK_AFTER_DAYS = 3
const RESEND_COOLDOWN_MINUTES = 2

export function generateEmailVerificationToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex")
}

export function getEmailVerificationExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + TOKEN_TTL_HOURS * 60 * 60 * 1000)
}

export function getEmailVerificationBlockAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + BLOCK_AFTER_DAYS * 24 * 60 * 60 * 1000)
}

export function isEmailVerificationBlocked(
  createdAt: Date,
  emailVerifiedAt: Date | null,
  emailVerificationSentAt?: Date | null
): boolean {
  if (emailVerifiedAt) return false
  if (!emailVerificationSentAt) return false
  return new Date() > getEmailVerificationBlockAt(createdAt)
}

export function canResendVerificationEmail(lastSentAt?: Date | null): boolean {
  if (!lastSentAt) return true
  const cooldownMs = RESEND_COOLDOWN_MINUTES * 60 * 1000
  return Date.now() - lastSentAt.getTime() >= cooldownMs
}

export function getEmailVerificationLink(token: string): string {
  const baseUrl = APP_URL.replace(/\/$/, "")
  return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`
}

export async function sendEmailVerificationEmail(params: {
  email: string
  name?: string | null
  token: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY manquant — email de vérification non envoyé")
    return
  }

  const verifyLink = getEmailVerificationLink(params.token)
  const displayName = params.name || "là"

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #111; font-size: 22px;">Confirme ton email</h1>
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        Salut ${displayName}, clique sur le bouton ci-dessous pour vérifier ton email.
      </p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${verifyLink}" style="display: inline-block; padding: 12px 20px; background: #10b981; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Vérifier mon email
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">
        Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur:
      </p>
      <p style="font-size: 12px; color: #666; word-break: break-all;">
        ${verifyLink}
      </p>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.email,
    subject: "Vérifie ton email Productif",
    html,
  })
}

export function renderEmailVerificationPage(params: {
  title: string
  message: string
}): string {
  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${params.title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 32px; color: #111;">
        <h1 style="font-size: 22px; margin-bottom: 12px;">${params.title}</h1>
        <p style="font-size: 15px; color: #333;">${params.message}</p>
      </body>
    </html>
  `
}
