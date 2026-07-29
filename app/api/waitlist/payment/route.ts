import { NextResponse } from "next/server"

/**
 * Création de paiement waitlist désactivée (juillet 2026).
 *
 * Cet endpoint créait une session Stripe de 1 € contre la promesse d'un tarif
 * de 4,95 €/mois à vie. La promesse est retirée, donc on cesse d'encaisser :
 * continuer à prendre 1 € créerait de nouvelles obligations sur une offre qui
 * n'existe plus.
 *
 * Fermer la création de session ne casse rien en aval : les sessions Stripe
 * déjà créées se règlent normalement, et /waitlist/success reste en place pour
 * les confirmer. Les routes de lecture /api/waitlist/* et l'admin restent
 * intactes pour identifier et honorer les personnes ayant déjà payé.
 *
 * L'implémentation d'origine est récupérable dans l'historique git.
 */
export async function POST() {
  return NextResponse.json(
    { error: "La waitlist est fermée. L'offre est disponible sur /pricing." },
    { status: 410 },
  )
}
