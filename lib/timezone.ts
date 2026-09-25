import { prisma } from "@/lib/prisma"

export const DEFAULT_TIMEZONE = "Europe/Paris"

/** Vrai si `tz` est un identifiant IANA que le runtime sait utiliser. */
export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length === 0 || tz.length > 64) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Enregistre le fuseau envoye par l'appareil s'il est valide et different de celui en base.
 * Attendu par l'appelant : un update non attendu serait tue par le gel serverless de Vercel.
 */
export async function syncUserTimezone(
  userId: string,
  reported: string | null,
  stored: string | null,
  ipFallback: string | null = null
): Promise<string | null> {
  // Le fuseau de l'appareil fait foi. A defaut (app anterieure a 1.4, web), on
  // prend celui que Vercel deduit de l'IP, mais seulement si rien n'est connu :
  // un VPN ne doit pas ecraser le fuseau qu'un telephone a deja donne.
  if (!isValidTimeZone(reported)) {
    if (stored || !isValidTimeZone(ipFallback)) return stored
    reported = ipFallback
  }
  if (reported === stored) return stored
  try {
    await prisma.user.update({ where: { id: userId }, data: { timezone: reported } })
    return reported
  } catch (error) {
    console.warn("[timezone] mise a jour impossible", error)
    return stored
  }
}

/** Le fuseau a utiliser pour un utilisateur, avec repli sur Europe/Paris. */
export function resolveTimezone(user: { timezone?: string | null }): string {
  return isValidTimeZone(user.timezone) ? user.timezone : DEFAULT_TIMEZONE
}
