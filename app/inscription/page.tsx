import { redirect } from "next/navigation"

/**
 * Seconde entrée du tunnel waitlist, fermée avec la première (juillet 2026).
 *
 * Cette page n'était liée depuis aucune autre, mais son URL restait publique et
 * elle déclenchait le même paiement de 1 € via /api/waitlist/payment, avec la
 * même promesse de tarif préférentiel à vie. Voir app/waitlist/page.tsx.
 *
 * Le formulaire multi-étapes reste dans ./multi-step-form.tsx, non monté.
 */
export default function InscriptionPage() {
  redirect('/pricing')
}
