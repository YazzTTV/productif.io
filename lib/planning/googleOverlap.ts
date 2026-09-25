/**
 * Detecte qu'un evenement Google ajoute dans la journee chevauche un bloc deja
 * place.
 *
 * Avant ce module, rien ne replanifiait quand l'agenda Google changeait : seuls
 * la nuit, les matieres, les chapitres et l'instantane Apple declenchaient un
 * recalcul. Un TD ajoute a 14 h gardait donc son bloc de revision a 14 h, et le
 * blocage automatique bloquait le telephone en plein cours (25 septembre, test
 * P4 : « WORK » de 9h30 a 12h30, les blocs de 9h30 et 10h10 n'ont pas bouge).
 *
 * Fonction pure, sans I/O : la route lit Google, ce module decide.
 */

export interface TimedBlock {
  start: string | Date
  end: string | Date
}

export interface BusyPeriod {
  start: Date
  end: Date
}

/**
 * Marge avant le debut d'un bloc : un bloc qui commence dans la minute est
 * considere comme en cours et n'est jamais deplace sous l'etudiant.
 */
const IN_PROGRESS_MARGIN_MS = 60 * 1000

const ms = (value: string | Date) => (value instanceof Date ? value.getTime() : new Date(value).getTime())

/** Les blocs a venir, ceux qu'une replanification a le droit de deplacer. */
export function upcomingBlocks<T extends TimedBlock>(blocks: T[], now: number): T[] {
  return blocks.filter((b) => ms(b.start) > now + IN_PROGRESS_MARGIN_MS)
}

/** Vrai si au moins un bloc a venir chevauche une periode occupee. */
export function hasBusyOverlap(blocks: TimedBlock[], busy: BusyPeriod[], now: number): boolean {
  return upcomingBlocks(blocks, now).some((b) => {
    const start = ms(b.start)
    const end = ms(b.end)
    return busy.some((p) => p.start.getTime() < end && p.end.getTime() > start)
  })
}
