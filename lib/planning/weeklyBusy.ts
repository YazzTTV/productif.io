/**
 * Emploi du temps approximatif de l'etudiant, declare a l'onboarding.
 *
 * Rempli a l'onboarding par la question de secours « tu finis les cours vers
 * 12h / 14h / 16h / 18h ? » et stocke dans User.weeklyBusy :
 *   { classesEndHour: 16, days: [1, 2, 3, 4, 5] }   (jours ISO, 1 = lundi)
 * Ca devient des creneaux occupes recurrents, de 8h a classesEndHour dans le
 * fuseau de l'etudiant, les jours listes.
 *
 * Pourquoi pas CalendarBusySnapshot : il n'a qu'une ligne par utilisateur,
 * n'accepte que la source "apple" et est ignore au bout de 3 jours. Une reponse
 * donnee une fois a l'onboarding doit valoir tout le semestre.
 *
 * Il s'ajoute aux agendas lus (Google, instantane Apple), il ne les remplace
 * pas et ne s'efface pas devant eux : voir weeklyBusyCoverage.
 *
 * Fonctions pures, sans I/O, comme StudyPlanner : autoPlan.ts lit la base et
 * decide avec weeklyBusyCoverage ce que cet emploi du temps doit couvrir.
 */

import { addDaysToKey, localTime, type BusyInterval } from '@/lib/planning/StudyPlanner'

export interface WeeklyBusy {
  /** Heure locale de fin des cours, entiere (12, 14, 16 ou 18 a l'onboarding). */
  classesEndHour: number
  /** Jours ISO avec cours, 1 = lundi ... 7 = dimanche. */
  days: number[]
}

/** Debut suppose des cours. Personne ne revise avant, meme sans cours. */
export const CLASSES_START = '08:00'
export const WEEKDAYS = [1, 2, 3, 4, 5]
/** Les reponses proposees a l'onboarding. D'autres heures sont acceptees. */
export const CLASSES_END_HOURS = [12, 14, 16, 18] as const

// Au-dela, la « fin des cours » n'a plus de sens : 8h-23h ne laisse rien.
const MIN_END_HOUR = 9
const MAX_END_HOUR = 22

/**
 * Lit la valeur JSON de User.weeklyBusy. null si absente ou inutilisable : une
 * valeur corrompue ne doit jamais bloquer toute la semaine.
 * `days` absent ou vide = du lundi au vendredi.
 */
export function parseWeeklyBusy(raw: unknown): WeeklyBusy | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const hour = (raw as any).classesEndHour
  if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < MIN_END_HOUR || hour > MAX_END_HOUR) return null

  const rawDays = (raw as any).days
  const days: number[] = Array.isArray(rawDays)
    ? [...new Set<number>(rawDays.filter((d: unknown): d is number => typeof d === 'number' && Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b)
    : []
  return { classesEndHour: hour, days: days.length > 0 ? days : [...WEEKDAYS] }
}

/**
 * Valeur a ecrire dans User.weeklyBusy pour une reponse a la question de
 * secours. null si l'heure n'est pas utilisable (ou si l'etudiant n'a pas
 * repondu) : l'appelant ecrit alors null.
 */
export function makeWeeklyBusy(classesEndHour: number | null | undefined, days: number[] = WEEKDAYS): WeeklyBusy | null {
  if (classesEndHour === null || classesEndHour === undefined) return null
  return parseWeeklyBusy({ classesEndHour, days })
}

/** Jour ISO (1 = lundi) d'une cle "yyyy-MM-dd". */
export function isoWeekday(dayKey: string): number {
  const [y, m, d] = dayKey.split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return day === 0 ? 7 : day
}

/**
 * Creneaux occupes de `dayCount` jours locaux a partir de `fromKey`.
 * `notBefore` rogne ce qui precede (fin d'un instantane Apple par exemple).
 */
export function weeklyBusyIntervals(
  weekly: WeeklyBusy,
  fromKey: string,
  dayCount: number,
  timeZone: string,
  notBefore: Date | null = null
): BusyInterval[] {
  const until = `${String(weekly.classesEndHour).padStart(2, '0')}:00`
  const out: BusyInterval[] = []
  for (let i = 0; i < dayCount; i++) {
    const key = addDaysToKey(fromKey, i)
    if (!weekly.days.includes(isoWeekday(key))) continue
    let start = localTime(key, CLASSES_START, timeZone)
    const end = localTime(key, until, timeZone)
    if (notBefore && start < notBefore) start = notBefore
    if (end > start) out.push({ start, end })
  }
  return out
}

export type WeeklyCoverage =
  | { use: false }
  | {
      use: true
      /** null = tout l'horizon ; sinon seulement a partir de cet instant. */
      from: Date | null
      reason: 'no_calendar' | 'apple_expired' | 'declared_with_calendar'
    }

/**
 * Ce que weeklyBusy doit couvrir, selon ce que les agendas disent deja.
 *
 * Regle : des qu'une reponse existe, elle couvre TOUT l'horizon et s'ajoute
 * aux agendas au lieu d'etre remplacee par eux. Seul l'onboarding ecrit
 * User.weeklyBusy, et seulement quand l'etudiant a repondu (ou garde l'heure
 * deduite de son agenda qu'on lui a montree) : c'est une contrainte declaree.
 *
 * Pourquoi ne plus s'effacer devant un agenda lu (regle d'avant le 26
 * septembre, relecture) :
 *   - un agenda lu n'est pas un agenda qui contient les cours. L'ENT est
 *     souvent absent de l'iPhone, et le serveur ne lit que l'agenda PRINCIPAL
 *     de Google. Un instantane Apple a 0 creneau ou un Google vide effacaient
 *     la reponse « je finis vers 18h », et les seances tombaient en plein cours ;
 *   - l'app renvoie un instantane Apple frais a chaque ouverture : pour un
 *     utilisateur actif la reponse n'etait donc jamais appliquee ;
 *   - le calcul rapide de l'onboarding (sans Google) et le calcul complet
 *     lance ensuite (avec Google) ne placaient pas les memes seances : l'heure
 *     annoncee sur l'ecran d'essai changeait quelques secondes plus tard.
 * Le prix : un etudiant dont l'agenda decrit parfaitement ses cours perd les
 * apres-midi libres avant l'heure qu'il a lui-meme donnee « en general ». On
 * prefere perdre un creneau que planifier (et bloquer ses applis) pendant un cours.
 *
 * `reason` ne sert qu'aux journaux et aux tests.
 */
export function weeklyBusyCoverage(input: {
  googleRead: boolean
  snapshot: { updatedAt: Date; rangeEnd: Date } | null
  now: Date
  snapshotMaxAgeMs: number
}): WeeklyCoverage {
  const { googleRead, snapshot, now, snapshotMaxAgeMs } = input
  if (snapshot) {
    const fresh = now.getTime() - snapshot.updatedAt.getTime() < snapshotMaxAgeMs
    return { use: true, from: null, reason: fresh ? 'declared_with_calendar' : 'apple_expired' }
  }
  if (googleRead) return { use: true, from: null, reason: 'declared_with_calendar' }
  return { use: true, from: null, reason: 'no_calendar' }
}
