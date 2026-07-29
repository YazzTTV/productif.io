/**
 * Source unique des prix affichés sur le web.
 *
 * Pourquoi ce fichier existe : les prix étaient recopiés à la main dans 8
 * endroits différents (page pricing, CTA fonctionnalités, réglages, modale
 * d'upgrade, onboarding web, page créateur...). Résultat, ils avaient divergé :
 * on trouvait encore 14,99 €/mois et 119 €/an alors que le mobile vendait autre
 * chose, et un écran affichait même des dollars. Toute nouvelle surface qui
 * affiche un prix doit importer ces constantes, jamais retaper un chiffre.
 *
 * Attention : ces valeurs ne concernent QUE l'affichage web. Dans l'app mobile,
 * les prix viennent de StoreKit via Superwall et ne doivent jamais être codés
 * en dur (un écart avec le store est un motif de rejet Apple).
 */

/** Abonnement mensuel, prix affiché en euros. */
export const PRICE_MONTHLY = 7.99

/** Abonnement annuel, prix affiché en euros. */
export const PRICE_YEARLY = 59

/** Offre de rentrée, du 15 août au 15 septembre 2026. */
export const PRICE_YEARLY_BACK_TO_SCHOOL = 49

/** Équivalent mensuel de l'annuel : 59 / 12, arrondi au centime. */
export const PRICE_YEARLY_PER_MONTH = 4.92

/** Économie de l'annuel par rapport au mensuel sur 12 mois. */
export const YEARLY_SAVING_PERCENT = 40

/** Durée de l'essai gratuit, en jours. Doit rester alignée sur les offres
 *  introductives configurées dans App Store Connect. */
export const TRIAL_DAYS = 7

/** Date de fin de l'offre de rentrée, pour l'affichage. */
export const BACK_TO_SCHOOL_END_LABEL = '15 septembre'

/** Formate un montant en euros à la française : 7,99 € / 59 €. */
export function formatEur(amount: number): string {
  const hasCents = !Number.isInteger(amount)
  return `${amount.toFixed(hasCents ? 2 : 0).replace('.', ',')} €`
}
