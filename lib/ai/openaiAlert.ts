import { Resend } from 'resend'

/**
 * Alerte quand OpenAI refuse de répondre pour cause de quota épuisé.
 *
 * Contexte : le 29 juillet 2026, le crédit OpenAI est tombé à zéro. La route
 * /api/tasks/agent/batch-create a renvoyé des 500, et comme l'étape
 * "Que devez-vous faire demain ?" de l'onboarding n'avait aucune issue de
 * secours, chaque nouvelle inscription se retrouvait bloquée sans jamais
 * atteindre l'app. La panne est passée totalement inaperçue jusqu'à un test
 * manuel. Ce module existe pour que ça ne se reproduise pas en silence.
 */

const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000 // 6 h

/**
 * Anti-avalanche. Limite : sur Vercel chaque instance serverless a sa propre
 * mémoire, donc en cas de trafic élevé on peut recevoir un email par instance
 * active (quelques-uns, pas des centaines). Pour une déduplication stricte il
 * faudrait persister la date du dernier envoi en base, ce qui demande une
 * migration Prisma. Volontairement écarté ici : le but est d'être prévenu, pas
 * d'être prévenu exactement une fois.
 */
let lastAlertAt = 0

/**
 * Reconnaît un dépassement de quota / problème de facturation OpenAI.
 * Volontairement large : mieux vaut une alerte de trop qu'une panne muette.
 */
export function isOpenAiQuotaError(error: unknown): boolean {
  const err = error as { status?: number; code?: string; error?: { code?: string } } | null
  const status = err?.status
  const code = err?.code ?? err?.error?.code
  const message = error instanceof Error ? error.message : String(error ?? '')

  if (status === 429) return true
  if (code === 'insufficient_quota' || code === 'billing_hard_limit_reached') return true

  return /exceeded your current quota|insufficient_quota|billing (hard )?limit|check your plan and billing/i.test(
    message,
  )
}

/**
 * Envoie l'alerte si l'erreur est bien un problème de quota. Ne lève jamais :
 * une alerte qui échoue ne doit pas aggraver l'incident qu'elle signale.
 */
export async function notifyOpenAiQuotaExhausted(
  error: unknown,
  context: string,
): Promise<void> {
  try {
    if (!isOpenAiQuotaError(error)) return

    const to = process.env.ALERT_EMAIL
    if (!to) {
      console.error(
        '🚨 [OpenAI] Quota épuisé mais ALERT_EMAIL n\'est pas configuré : aucune alerte envoyée.',
      )
      return
    }
    if (!process.env.RESEND_API_KEY) {
      console.error('🚨 [OpenAI] Quota épuisé mais RESEND_API_KEY manquant : aucune alerte envoyée.')
      return
    }

    const now = Date.now()
    if (now - lastAlertAt < ALERT_COOLDOWN_MS) {
      console.warn('[OpenAI] Quota épuisé, alerte déjà envoyée récemment (temporisation).')
      return
    }
    lastAlertAt = now

    const message = error instanceof Error ? error.message : String(error ?? 'inconnue')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: process.env.SCAN_FROM_EMAIL || 'Productif <onboarding@resend.dev>',
      to,
      subject: '[URGENT] productif.io : crédit OpenAI épuisé',
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #b91c1c; font-size: 20px;">Le crédit OpenAI est épuisé</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #333;">
            L'API OpenAI refuse les requêtes. Tant que ce n'est pas rechargé, toutes
            les fonctionnalités IA sont hors service.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #333;">
            <b>Impact principal :</b> l'étape de saisie des tâches dans l'onboarding
            dépend de l'IA. Elle basculera sur un mode dégradé (les tâches sont créées
            depuis le texte brut, sans découpage intelligent). Les inscriptions
            continuent, mais la qualité du parcours baisse.
          </p>
          <p style="font-size: 14px; color: #555;">
            <b>Où :</b> ${context}<br />
            <b>Erreur :</b> ${message.slice(0, 300)}<br />
            <b>Quand :</b> ${new Date(now).toISOString()}
          </p>
          <p style="margin-top: 24px;">
            <a href="https://platform.openai.com/settings/organization/billing/overview"
               style="display: inline-block; padding: 12px 24px; background: #b91c1c; color: #fff; text-decoration: none; font-weight: 600; border-radius: 8px;">
              Recharger le crédit OpenAI
            </a>
          </p>
          <p style="font-size: 13px; color: #777; margin-top: 20px;">
            Pense à activer le rechargement automatique pour éviter que ça retombe en panne.
            Prochaine alerte possible dans 6 h au plus tôt.
          </p>
        </div>`,
    })

    console.error(`🚨 [OpenAI] Quota épuisé — alerte envoyée à ${to} (contexte : ${context})`)
  } catch (alertError) {
    console.error('[OpenAI] Échec de l\'envoi de l\'alerte quota:', alertError)
  }
}
