import { redirect } from "next/navigation"

/**
 * Tunnel waitlist fermé (juillet 2026).
 *
 * Cette page proposait de payer 1 € pour verrouiller un tarif de 4,95 €/mois
 * à vie, en affichant un tarif public futur de 20 €/mois. Les deux chiffres
 * sont devenus faux avec la grille 7,99 €/mois et 59 €/an : le "20 €/mois"
 * était un prix de référence trompeur, et l'avantage "à vie" ne se distinguait
 * plus du tarif annuel standard (4,92 €/mois).
 *
 * Conservés volontairement : /waitlist/success (page de confirmation Stripe des
 * personnes ayant déjà payé), les routes /api/waitlist/* et l'admin
 * /dashboard/admin/waitlist, pour pouvoir identifier et honorer les payeurs.
 *
 * L'ancienne page reste récupérable dans l'historique git si le tunnel rouvre.
 */
export default function WaitlistPage() {
  redirect('/pricing')
}
