/**
 * StudyPlanner : place les chapitres a reviser dans les creneaux libres des
 * prochains jours, dans le fuseau de l'etudiant.
 *
 * Volontairement sans aucune I/O, comme CatchUpPlanner : les matieres, les
 * chapitres et les creneaux occupes (Google, Apple, blocs fixes) arrivent en
 * entree, le resultat est une liste de blocs dates. L'appelant (autoPlan.ts)
 * decide d'ecrire ou non.
 *
 * Ce que ce moteur fait et que WeeklyPlanningEngine ne faisait pas :
 *   - il calcule les heures dans le fuseau de l'utilisateur, et non a l'heure
 *     du serveur (UTC sur Vercel, donc "8h-22h" tombait de 4h a 18h a Montreal) ;
 *   - il utilise la date d'examen : l'urgence monte quand l'examen approche,
 *     et aucun chapitre n'est place apres (ni pendant les jours de revision
 *     generale qui le precedent) ;
 *   - il ne depend d'aucun agenda en particulier.
 *
 * Regle de repartition, jour par jour : on choisit a chaque fois la matiere au
 * meilleur score (coefficient x urgence x besoin), divise par ce qu'elle a deja
 * recu dans la journee. Ca melange les matieres au lieu de passer la journee
 * sur une seule.
 *
 * Exception, le regime critique : une matiere qui ne finira pas a temps si elle
 * n'est pas servie en premier passe devant, mais seulement pour ce qui lui
 * manque aujourd'hui. Le test porte sur ses vraies echeances (examen, echeance
 * personnelle), jamais sur l'horizon de 14 jours : voir criticalNeed.
 */

import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'

const MS_PER_MINUTE = 60 * 1000
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE

export const DEFAULT_BLOCK_MINUTES = 30
export const MIN_BLOCK_MINUTES = 15
export const MAX_BLOCK_MINUTES = 180

export interface TimeWindow {
  /** "HH:mm", heure locale. */
  from: string
  to: string
}

export interface PlannerSubject {
  id: string
  name: string
  coefficient: number
  /** Date de l'examen. */
  deadline: Date | null
}

export interface PlannerTask {
  id: string
  subjectId: string
  estimatedMinutes: number | null
  dueDate: Date | null
  order: number
  createdAt: Date
}

export interface BusyInterval {
  start: Date
  end: Date
}

export interface PlannerOptions {
  now: Date
  /** Fuseau IANA, ex. "America/Toronto". */
  timeZone: string
  horizonDays?: number
  dailyCapacityMinutes?: number
  windows?: TimeWindow[]
  /** Rien n'est place dans les N minutes qui suivent `now`. */
  minLeadMinutes?: number
  /** Jours avant l'examen reserves a la revision generale, sans nouveau chapitre. */
  reviewBufferDays?: number
  /** Pause laissee libre apres chaque bloc. */
  breakMinutes?: number
}

export interface PlannedBlock {
  taskId: string
  subjectId: string
  start: Date
  end: Date
  minutes: number
}

export type UnplacedReason = 'no_capacity' | 'deadline_passed'

export interface StudyPlan {
  blocks: PlannedBlock[]
  unplaced: { taskId: string; subjectId: string; reason: UnplacedReason }[]
  summary: {
    blockCount: number
    totalMinutes: number
    unplacedCount: number
    horizonDays: number
    timeZone: string
  }
}

export const DEFAULT_WINDOWS: TimeWindow[] = [
  { from: '09:00', to: '12:00' },
  { from: '14:00', to: '19:00' },
  { from: '20:00', to: '22:00' },
]

export const DEFAULT_OPTIONS = {
  horizonDays: 14,
  dailyCapacityMinutes: 180,
  minLeadMinutes: 30,
  reviewBufferDays: 2,
  breakMinutes: 10,
}

/**
 * Part de la capacite des jours a venir sur laquelle on compte pour une matiere.
 * Pas 100 % : les fenetres, les cours et les autres matieres en prennent, donc
 * une matiere qui a besoin de toute la capacite restante est deja en retard.
 */
export const CRITICAL_SHARE = 0.75

/** "yyyy-MM-dd" du jour local contenant `date`. */
export function localDateKey(date: Date, timeZone: string): string {
  return formatInTimeZone(date, timeZone, 'yyyy-MM-dd')
}

/** Ajoute `days` jours calendaires a une cle "yyyy-MM-dd". */
export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const shifted = new Date(Date.UTC(y, m - 1, d) + days * MS_PER_DAY)
  return shifted.toISOString().slice(0, 10)
}

/** Nombre de jours calendaires de `fromKey` a `toKey`. */
export function daysBetweenKeys(fromKey: string, toKey: string): number {
  const toUtc = (key: string) => {
    const [y, m, d] = key.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUtc(toKey) - toUtc(fromKey)) / MS_PER_DAY)
}

/** Instant UTC d'une heure locale donnee un jour local donne. Gere les changements d'heure. */
export function localTime(dayKey: string, hhmm: string, timeZone: string): Date {
  return fromZonedTime(`${dayKey}T${hhmm}:00`, timeZone)
}

function blockMinutes(task: PlannerTask): number {
  const raw = task.estimatedMinutes
  if (raw === null || !Number.isFinite(raw) || raw <= 0) return DEFAULT_BLOCK_MINUTES
  return Math.min(MAX_BLOCK_MINUTES, Math.max(MIN_BLOCK_MINUTES, Math.round(raw)))
}

/** Soustrait des intervalles occupes d'une liste d'intervalles libres. */
function subtract(free: BusyInterval[], busy: BusyInterval[]): BusyInterval[] {
  let result = free
  for (const b of busy) {
    const next: BusyInterval[] = []
    for (const f of result) {
      if (b.end <= f.start || b.start >= f.end) {
        next.push(f)
        continue
      }
      if (b.start > f.start) next.push({ start: f.start, end: b.start })
      if (b.end < f.end) next.push({ start: b.end, end: f.end })
    }
    result = next
  }
  return result
}

/** Arrondit au multiple de 5 minutes superieur, pour des heures lisibles. */
function ceilTo5(date: Date): Date {
  const step = 5 * MS_PER_MINUTE
  return new Date(Math.ceil(date.getTime() / step) * step)
}

interface QueueItem {
  task: PlannerTask
  /** Dernier jour de l'horizon ou le chapitre peut etre place. */
  lastDay: number
  /**
   * Dernier jour ou il doit etre fait, sans le plafond de l'horizon.
   * Infinity = aucune echeance (ni examen, ni echeance personnelle a venir).
   */
  deadlineDay: number
  minutes: number
}

/**
 * Minutes qu'une matiere doit recevoir AUJOURD'HUI (jour `day`) pour que ce qui
 * lui reste tienne ensuite dans CRITICAL_SHARE de la capacite des jours
 * suivants, echeance par echeance. null = pas critique.
 *
 * Deux choix, et pourquoi :
 *   - les jours restants sont comptes jusqu'a la VRAIE echeance. L'ancien test
 *     les plafonnait au dernier jour de l'horizon (13) tout en comptant TOUS
 *     les chapitres de la matiere : une matiere de 63 chapitres de 30 min ou
 *     plus (1 890 min = 14 x 180 x 0,75) passait critique meme avec un examen
 *     dans trois mois, ou sans examen du tout, et prenait toute la capacite de
 *     chaque jour. Une grosse UE de PASS privait ainsi les autres matieres
 *     pendant douze jours sur quatorze ;
 *   - la matiere critique ne passe devant que pour ce qui lui MANQUE, pas pour
 *     toute la journee. Une fois ce minimum servi, elle retourne au partage
 *     proportionnel avec les autres.
 *
 * Le test est fait par echeance (examen de la matiere, echeances personnelles
 * de certains chapitres) : quelques chapitres dus demain peuvent rendre une
 * matiere critique meme si son examen est loin.
 */
function criticalNeed(
  pending: QueueItem[],
  day: number,
  capacity: number
): { minutes: number; deadlineDay: number } | null {
  const minutesByDeadline = new Map<number, number>()
  for (const item of pending) {
    if (!Number.isFinite(item.deadlineDay)) continue
    minutesByDeadline.set(item.deadlineDay, (minutesByDeadline.get(item.deadlineDay) ?? 0) + item.minutes)
  }

  let worst: { minutes: number; deadlineDay: number } | null = null
  let dueSoFar = 0
  for (const deadlineDay of [...minutesByDeadline.keys()].sort((a, b) => a - b)) {
    dueSoFar += minutesByDeadline.get(deadlineDay)!
    // Jours apres aujourd'hui, jusqu'a l'echeance comprise.
    const laterDays = Math.max(0, deadlineDay - day)
    const need = dueSoFar - laterDays * capacity * CRITICAL_SHARE
    if (need > 0 && (!worst || need > worst.minutes)) worst = { minutes: need, deadlineDay }
  }
  return worst
}

export function planStudy(
  subjects: PlannerSubject[],
  tasks: PlannerTask[],
  busy: BusyInterval[],
  options: PlannerOptions
): StudyPlan {
  const timeZone = options.timeZone
  const horizonDays = Math.max(1, Math.floor(options.horizonDays ?? DEFAULT_OPTIONS.horizonDays))
  const capacity = Math.max(
    MIN_BLOCK_MINUTES,
    Math.floor(options.dailyCapacityMinutes ?? DEFAULT_OPTIONS.dailyCapacityMinutes)
  )
  const windows = options.windows ?? DEFAULT_WINDOWS
  const leadMs = (options.minLeadMinutes ?? DEFAULT_OPTIONS.minLeadMinutes) * MS_PER_MINUTE
  const reviewBuffer = Math.max(0, Math.floor(options.reviewBufferDays ?? DEFAULT_OPTIONS.reviewBufferDays))
  const breakMs = Math.max(0, options.breakMinutes ?? DEFAULT_OPTIONS.breakMinutes) * MS_PER_MINUTE

  const todayKey = localDateKey(options.now, timeZone)
  const earliest = new Date(options.now.getTime() + leadMs)
  const subjectById = new Map(subjects.map((s) => [s.id, s]))

  // Dernier jour (index a partir d'aujourd'hui) ou chaque chapitre doit etre
  // fait, SANS plafond d'horizon : le regime critique en a besoin (voir
  // criticalNeed). -1 = l'examen est aujourd'hui ou deja passe. Infinity = aucune
  // echeance.
  const deadlineDayFor = (task: PlannerTask): number => {
    let last = Number.POSITIVE_INFINITY
    const subject = subjectById.get(task.subjectId)
    if (subject?.deadline) {
      const examIndex = daysBetweenKeys(todayKey, localDateKey(subject.deadline, timeZone))
      if (examIndex <= 0) return -1
      // Garder les jours de revision generale libres, sauf si l'examen est trop
      // proche pour se le permettre : on place alors jusqu'a la veille.
      const withBuffer = examIndex - 1 - reviewBuffer
      last = withBuffer >= 0 ? withBuffer : examIndex - 1
    }
    if (task.dueDate) {
      // Une echeance personnelle deja passee ne doit pas faire disparaitre le
      // chapitre du planning : il reste a faire, au plus tot, borne par l'examen.
      const dueIndex = daysBetweenKeys(todayKey, localDateKey(task.dueDate, timeZone))
      if (dueIndex >= 0) last = Math.min(last, dueIndex)
    }
    return last
  }

  const unplaced: StudyPlan['unplaced'] = []

  // File de chapitres par matiere, dans l'ordre ou l'etudiant les a crees.
  const queues = new Map<string, QueueItem[]>()
  const sorted = [...tasks].sort(
    (a, b) =>
      a.order - b.order ||
      a.createdAt.getTime() - b.createdAt.getTime() ||
      a.id.localeCompare(b.id)
  )
  for (const task of sorted) {
    if (!subjectById.has(task.subjectId)) continue
    const deadlineDay = deadlineDayFor(task)
    if (deadlineDay < 0) {
      unplaced.push({ taskId: task.id, subjectId: task.subjectId, reason: 'deadline_passed' })
      continue
    }
    const queue = queues.get(task.subjectId) ?? []
    queue.push({ task, lastDay: Math.min(horizonDays - 1, deadlineDay), deadlineDay, minutes: blockMinutes(task) })
    queues.set(task.subjectId, queue)
  }

  const blocks: PlannedBlock[] = []
  const givenTotal = new Map<string, number>()

  for (let day = 0; day < horizonDays; day++) {
    const dayKey = addDaysToKey(todayKey, day)

    let free: BusyInterval[] = windows
      .map((w) => ({ start: localTime(dayKey, w.from, timeZone), end: localTime(dayKey, w.to, timeZone) }))
      .filter((w) => w.end > w.start)
    free = subtract(free, busy)
      .map((f) => ({ start: ceilTo5(f.start > earliest ? f.start : earliest), end: f.end }))
      .filter((f) => f.end.getTime() - f.start.getTime() >= MIN_BLOCK_MINUTES * MS_PER_MINUTE)
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    let remaining = capacity
    const skipped = new Set<string>()

    while (remaining >= MIN_BLOCK_MINUTES) {
      // Deux regimes :
      //  - une matiere "critique" (ce qui lui reste ne tiendra plus a son
      //    echeance si elle n'est pas servie aujourd'hui) passe devant, la plus
      //    pressee d'abord, et seulement pour ce qui lui manque (criticalNeed) ;
      //  - sinon partage proportionnel : chaque matiere recoit du temps au prorata
      //    de coefficient x urgence, sur tout l'horizon (file equitable ponderee).
      //    Ca melange les matieres chaque jour au lieu de finir la plus lourde
      //    avant d'ouvrir les autres.
      let critical: { subjectId: string; deadlineDay: number; need: number } | null = null
      let fair: { subjectId: string; virtual: number } | null = null

      for (const [subjectId, queue] of queues) {
        if (skipped.has(subjectId)) continue
        const pending = queue.filter((item) => item.lastDay >= day)
        if (pending.length === 0) continue
        const subject = subjectById.get(subjectId)!

        const need = criticalNeed(pending, day, capacity)
        if (need) {
          // Echeance la plus proche d'abord ; a echeance egale (les UE d'un meme
          // concours), le plus gros manque. Comme le manque baisse a chaque bloc
          // servi, deux matieres critiques en meme temps s'alternent au lieu que
          // la premiere de la liste prenne tout.
          const before =
            !critical ||
            need.deadlineDay < critical.deadlineDay ||
            (need.deadlineDay === critical.deadlineDay && need.minutes > critical.need)
          if (before) critical = { subjectId, deadlineDay: need.deadlineDay, need: need.minutes }
        }

        const daysToExam = subject.deadline
          ? Math.max(1, daysBetweenKeys(dayKey, localDateKey(subject.deadline, timeZone)))
          : 30
        const weight = Math.max(1, subject.coefficient) * (1 + 7 / daysToExam)
        const virtual = ((givenTotal.get(subjectId) ?? 0) + pending[0].minutes) / weight
        if (!fair || virtual < fair.virtual) fair = { subjectId, virtual }
      }

      const best = critical ?? fair
      if (!best) break

      const queue = queues.get(best.subjectId)!
      // En regime critique, on sert un chapitre de l'echeance qui presse, pas le
      // premier de la file : sinon trois chapitres dus demain attendent derriere
      // des chapitres de fin de semestre, et le manque ne baisse jamais.
      const crunch = critical ? critical.deadlineDay : Number.POSITIVE_INFINITY
      const index = queue.findIndex((item) => item.lastDay >= day && item.deadlineDay <= crunch)
      const item = queue[index]
      const needMs = item.minutes * MS_PER_MINUTE

      if (item.minutes > remaining) {
        skipped.add(best.subjectId)
        continue
      }

      const slotIndex = free.findIndex((f) => f.end.getTime() - f.start.getTime() >= needMs)
      if (slotIndex === -1) {
        skipped.add(best.subjectId)
        continue
      }

      const slot = free[slotIndex]
      const start = slot.start
      const end = new Date(start.getTime() + needMs)
      blocks.push({ taskId: item.task.id, subjectId: best.subjectId, start, end, minutes: item.minutes })

      const nextStart = ceilTo5(new Date(end.getTime() + breakMs))
      if (slot.end.getTime() - nextStart.getTime() >= MIN_BLOCK_MINUTES * MS_PER_MINUTE) {
        free[slotIndex] = { start: nextStart, end: slot.end }
      } else {
        free.splice(slotIndex, 1)
      }

      queue.splice(index, 1)
      remaining -= item.minutes
      givenTotal.set(best.subjectId, (givenTotal.get(best.subjectId) ?? 0) + item.minutes)
    }
  }

  for (const [subjectId, queue] of queues) {
    for (const item of queue) {
      unplaced.push({ taskId: item.task.id, subjectId, reason: 'no_capacity' })
    }
  }

  blocks.sort((a, b) => a.start.getTime() - b.start.getTime())

  return {
    blocks,
    unplaced,
    summary: {
      blockCount: blocks.length,
      totalMinutes: blocks.reduce((sum, b) => sum + b.minutes, 0),
      unplacedCount: unplaced.length,
      horizonDays,
      timeZone,
    },
  }
}
