/**
 * CatchUpPlanner — redistribution des blocs non faits sur les jours suivants.
 *
 * Le moteur hebdomadaire (WeeklyPlanningEngine) place les sessions de la semaine.
 * Ce planificateur repond a une autre question : qu'est-ce qu'on fait des blocs
 * qui etaient prevus et qui n'ont pas ete faits ?
 *
 * Volontairement sans aucune I/O : pas de Prisma, pas de Google Calendar. Les
 * taches et la charge existante sont passees en entree, le resultat est une liste
 * de deplacements proposes. Ca rend la logique testable et ca permet a l'appelant
 * de decider s'il applique ou s'il ne fait qu'un apercu.
 *
 * Regle de repartition : on ne repousse pas tout au lendemain. Chaque bloc va sur
 * le jour le MOINS charge de l'horizon qui peut encore l'accueillir, ce qui etale
 * naturellement le rattrapage au lieu d'ecraser une seule journee.
 */

const MS_PER_MINUTE = 60 * 1000
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE

export const DEFAULT_HORIZON_DAYS = 7
export const DEFAULT_DAILY_CAPACITY_MINUTES = 180
export const DEFAULT_TASK_MINUTES = 30

export interface CatchUpTask {
  id: string
  title: string
  subjectId: string | null
  subjectName: string | null
  /** Date limite de la matiere. Un bloc ne sera jamais replace apres. */
  subjectDeadline: Date | null
  estimatedMinutes: number | null
  /** Convention du modele Task : plus grand = plus prioritaire. */
  priority: number | null
  /** L'ancien creneau, dans le passe. */
  scheduledFor: Date
}

export interface ScheduledLoad {
  scheduledFor: Date
  estimatedMinutes: number | null
}

export interface CatchUpMove {
  taskId: string
  title: string
  subjectId: string | null
  subjectName: string | null
  from: string
  to: string
  minutes: number
  /** Le jour retenu depasse la capacite quotidienne : place quand meme, mais signale. */
  overCapacity: boolean
  /** La date limite de la matiere est deja passee : rien ne peut plus la respecter. */
  deadlinePassed: boolean
}

export interface CatchUpDayLoad {
  date: string
  minutesBefore: number
  minutesAfter: number
  capacityMinutes: number
}

export interface CatchUpPlan {
  moves: CatchUpMove[]
  days: CatchUpDayLoad[]
  summary: {
    taskCount: number
    totalMinutes: number
    horizonDays: number
    daysUsed: number
    overCapacityCount: number
    deadlinePassedCount: number
    capacityMinutes: number
  }
}

export interface CatchUpOptions {
  /** Instant de reference. Injecte pour rendre le calcul deterministe. */
  now: Date
  /**
   * Decalage renvoye par Date.prototype.getTimezoneOffset() cote client
   * (Paris en ete = -120). Sans lui, un serveur en UTC classe mal les blocs
   * de fin de soiree : 23h a Paris, c'est deja le lendemain en UTC.
   */
  tzOffsetMinutes?: number
  horizonDays?: number
  dailyCapacityMinutes?: number
  /** Blocs deja places dans l'horizon, pour ne pas surcharger un jour deja plein. */
  existingLoad?: ScheduledLoad[]
}

/** Index du jour local contenant `date`. Deux instants du meme jour local partagent cet index. */
export function localDayIndex(date: Date, tzOffsetMinutes: number): number {
  return Math.floor((date.getTime() - tzOffsetMinutes * MS_PER_MINUTE) / MS_PER_DAY)
}

/** Millisecondes ecoulees depuis minuit local. */
export function localTimeOfDayMs(date: Date, tzOffsetMinutes: number): number {
  const localMs = date.getTime() - tzOffsetMinutes * MS_PER_MINUTE
  return ((localMs % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY
}

/** Instant UTC correspondant a un jour local et une heure locale donnes. */
export function fromLocalDayIndex(
  dayIndex: number,
  timeOfDayMs: number,
  tzOffsetMinutes: number
): Date {
  return new Date(dayIndex * MS_PER_DAY + timeOfDayMs + tzOffsetMinutes * MS_PER_MINUTE)
}

function taskMinutes(task: Pick<CatchUpTask, 'estimatedMinutes'>): number {
  const raw = task.estimatedMinutes
  if (raw === null || raw === undefined || !Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_TASK_MINUTES
  }
  return Math.round(raw)
}

/**
 * Ordre de traitement : ce qui est le plus contraint passe en premier, parce que
 * les premiers servis ont le plus grand choix de jours.
 *   1. date limite de matiere la plus proche (sans date limite = en dernier)
 *   2. priorite la plus forte
 *   3. bloc le plus ancien (celui qui traine depuis le plus longtemps)
 */
function compareUrgency(a: CatchUpTask, b: CatchUpTask): number {
  const deadlineA = a.subjectDeadline ? a.subjectDeadline.getTime() : Number.POSITIVE_INFINITY
  const deadlineB = b.subjectDeadline ? b.subjectDeadline.getTime() : Number.POSITIVE_INFINITY
  if (deadlineA !== deadlineB) return deadlineA - deadlineB

  const priorityA = a.priority ?? 0
  const priorityB = b.priority ?? 0
  if (priorityA !== priorityB) return priorityB - priorityA

  return a.scheduledFor.getTime() - b.scheduledFor.getTime()
}

export function planCatchUp(tasks: CatchUpTask[], options: CatchUpOptions): CatchUpPlan {
  const tzOffsetMinutes = options.tzOffsetMinutes ?? 0
  const horizonDays = Math.max(1, Math.floor(options.horizonDays ?? DEFAULT_HORIZON_DAYS))
  const capacityMinutes = Math.max(
    1,
    Math.floor(options.dailyCapacityMinutes ?? DEFAULT_DAILY_CAPACITY_MINUTES)
  )

  const todayIndex = localDayIndex(options.now, tzOffsetMinutes)
  const lastIndex = todayIndex + horizonDays - 1

  // Charge de depart de chaque jour de l'horizon, blocs deja places compris.
  const loadByDay = new Array<number>(horizonDays).fill(0)
  for (const entry of options.existingLoad ?? []) {
    const slot = localDayIndex(entry.scheduledFor, tzOffsetMinutes) - todayIndex
    if (slot >= 0 && slot < horizonDays) {
      loadByDay[slot] += taskMinutes(entry)
    }
  }
  const loadBefore = [...loadByDay]

  const moves: CatchUpMove[] = []
  const ordered = [...tasks].sort(compareUrgency)

  for (const task of ordered) {
    const minutes = taskMinutes(task)

    // Borne haute : la date limite de la matiere, si elle tombe dans l'horizon.
    let maxSlot = horizonDays - 1
    let deadlinePassed = false
    if (task.subjectDeadline) {
      const deadlineSlot = localDayIndex(task.subjectDeadline, tzOffsetMinutes) - todayIndex
      if (deadlineSlot < 0) {
        // Date limite deja passee : plus rien ne la respecte, on remonte le bloc
        // au plus tot et on le signale a l'appelant.
        deadlinePassed = true
        maxSlot = 0
      } else {
        maxSlot = Math.min(maxSlot, deadlineSlot)
      }
    }

    // Le jour le moins charge qui accepte encore le bloc, le plus tot en cas d'egalite.
    let chosen = -1
    for (let slot = 0; slot <= maxSlot; slot++) {
      if (loadByDay[slot] + minutes > capacityMinutes) continue
      if (chosen === -1 || loadByDay[slot] < loadByDay[chosen]) chosen = slot
    }

    // Aucun jour n'a la place : on prend quand meme le moins charge dans les bornes
    // plutot que d'abandonner le bloc en silence.
    let overCapacity = false
    if (chosen === -1) {
      overCapacity = true
      chosen = 0
      for (let slot = 1; slot <= maxSlot; slot++) {
        if (loadByDay[slot] < loadByDay[chosen]) chosen = slot
      }
    }

    loadByDay[chosen] += minutes

    // On conserve l'heure d'origine du bloc : seul le jour change.
    const target = fromLocalDayIndex(
      todayIndex + chosen,
      localTimeOfDayMs(task.scheduledFor, tzOffsetMinutes),
      tzOffsetMinutes
    )

    moves.push({
      taskId: task.id,
      title: task.title,
      subjectId: task.subjectId,
      subjectName: task.subjectName,
      from: task.scheduledFor.toISOString(),
      to: target.toISOString(),
      minutes,
      overCapacity,
      deadlinePassed,
    })
  }

  const days: CatchUpDayLoad[] = []
  for (let slot = 0; slot < horizonDays; slot++) {
    days.push({
      date: fromLocalDayIndex(todayIndex + slot, 0, tzOffsetMinutes).toISOString(),
      minutesBefore: loadBefore[slot],
      minutesAfter: loadByDay[slot],
      capacityMinutes,
    })
  }

  return {
    moves,
    days,
    summary: {
      taskCount: moves.length,
      totalMinutes: moves.reduce((sum, move) => sum + move.minutes, 0),
      horizonDays,
      daysUsed: days.filter((day, slot) => day.minutesAfter > loadBefore[slot]).length,
      overCapacityCount: moves.filter((move) => move.overCapacity).length,
      deadlinePassedCount: moves.filter((move) => move.deadlinePassed).length,
      capacityMinutes,
    },
  }
}

export { MS_PER_DAY, MS_PER_MINUTE }
