import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Utiliser onboarding@resend.dev pour les tests si domaine non vérifié
const FROM_EMAIL = process.env.SCAN_FROM_EMAIL || 'Productif <onboarding@resend.dev>'

export interface SendSessionEmailParams {
  email: string
  nbTasks: number
  totalTime: string
  tasks: string
  sessionId: string
  priorities?: string[]
  planningHtml?: string
}

/**
 * Envoie l'email de résumé de session (scan planning)
 * Appelé quand une session scan se termine et que l'utilisateur demande son planning par email
 */
export async function sendSessionEmail({
  email,
  nbTasks,
  totalTime,
  tasks,
  sessionId,
  priorities = [],
  planningHtml,
}: SendSessionEmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY manquant — email non envoyé')
    return
  }

  const prioritiesBlock =
    priorities.length > 0
      ? `
      <h3 style="color: #10b981; margin-top: 24px;">🎯 Tes priorités</h3>
      <ul style="line-height: 1.8;">
        ${priorities.map((p) => `<li>${p}</li>`).join('')}
      </ul>`
      : ''

  const appStoreUrl =
    process.env.NEXT_PUBLIC_APP_STORE_URL || 'https://apps.apple.com/app/productifio/id673896827'

  const html = planningHtml
    ? `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">Salut ! 👋</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Voici ton planning optimisé comme promis. L'IA a organisé ta journée en fonction de tes pics d'énergie et de tes priorités.
        </p>
        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
          <b>${nbTasks} tâches</b> • <b>${totalTime} h</b> au total
        </p>
        ${planningHtml}
        ${prioritiesBlock}
        <div style="margin-top: 32px; padding: 24px; background: #f0fdf4; border-radius: 12px; text-align: center;">
          <p style="font-size: 16px; color: #166534; margin: 0 0 16px 0; font-weight: 600;">
            Imagine avoir ça automatiquement chaque jour 🚀
          </p>
          <a href="${appStoreUrl}" style="display: inline-block; padding: 14px 28px; background: #10b981; color: white; text-decoration: none; font-weight: 600; border-radius: 10px; font-size: 16px;">
            Installer l'app Productif
          </a>
          <p style="font-size: 13px; color: #166534; margin: 12px 0 0 0; opacity: 0.9;">
            Rappels intelligents, suivi de progrès, planning auto
          </p>
        </div>
      </div>`
    : `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #111;">Salut ! 👋</h1>
        <p>Voici ton planning.</p>
        <p><b>Tâches :</b> ${nbTasks} • <b>Temps total :</b> ${totalTime} h</p>
        <p>${tasks}</p>
        ${prioritiesBlock}
        <p style="margin-top: 24px;"><a href="${appStoreUrl}" style="color: #10b981; font-weight: 600;">Installer l'app Productif →</a></p>
      </div>`

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Résumé de ta session Productif',
    html,
  })
}
