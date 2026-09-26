/**
 * Onboarding 1.5 : ce que fait POST /api/onboarding/plan, dont l'en-tete
 * explique l'ensemble (les trois temps, idempotence, date inconnue, matieres
 * deja existantes) :
 *   - lecture et nettoyage de la requete (parseRequest) ;
 *   - temps 1, creation des matieres et chapitres (createFromRequest) ;
 *   - temps 2 et 3, calcul rapide borne puis calcul complet apres la reponse
 *     (planAndSchedule).
 *
 * Separe de la route pour deux raisons : un fichier route.ts de Next n'a le
 * droit d'exporter que ses methodes et sa configuration, et cette logique doit
 * se tester sans base ni requete (scripts/test-onboarding-plan.ts, avec un faux
 * client et des calculs simules).
 */

import { after } from 'next/server'
import { Prisma, type PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { calculateTaskOrder } from '@/lib/tasks'
import { localTime } from '@/lib/planning/StudyPlanner'
import { CLASSES_END_HOURS, makeWeeklyBusy } from '@/lib/planning/weeklyBusy'
import { deleteGeneratedSessions } from '@/lib/planning/generatedSessions'
import { replanUser, replanUserSafely, type ReplanResult } from '@/lib/planning/autoPlan'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'

export const BIG_COEFFICIENT = 5
export const DEFAULT_COEFFICIENT = 2
export const CHAPTER_MINUTES = 30
/** Seances generiques d'une matiere sans chapitres (« pas encore »). */
export const GENERATED_SESSIONS = 6
/** Priorite des chapitres importes, alignee sur l'import en masse (medium). */
const CHAPTER_PRIORITY = 3

// Bornes de sante, au-dessus de celles de l'app (lib/onboardingLogic.ts :
// 12 matieres, 120 titres, 80 chapitres en nombre), pour ne jamais rejeter une
// requete legitime.
const MAX_SUBJECTS = 20
const MAX_SUBJECT_NAME = 100
const MAX_TITLES_PER_SUBJECT = 200
const MAX_TITLE_LENGTH = 200
const MAX_CHAPTER_COUNT = 120
const MAX_TOTAL_CHAPTERS = 1500
const MAX_ANSWER_KEYS = 50
const MAX_ANSWER_ARRAY = 30
const MAX_ANSWER_STRING = 500

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{8,128}$/
const YMD = /^(\d{4})-(\d{2})-(\d{2})$/

export type ChaptersInput = { kind: 'titles'; titles: string[] } | { kind: 'count'; count: number } | { kind: 'none' }

export interface SubjectInput {
  name: string
  key: string
  big: boolean
  chapters: ChaptersInput
}

export interface PlanRequest {
  idempotencyKey: string
  examDate: string | null
  subjects: SubjectInput[]
  classesEndHour: number | null
  answers: Prisma.InputJsonObject | undefined
}

export class BadRequest extends Error {}

// ---------------------------------------------------------------------------
// Lecture et nettoyage de la requete
// ---------------------------------------------------------------------------

function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_SUBJECT_NAME)
}

/**
 * Cle de comparaison des noms de matiere : casse, accents et espaces ignores.
 * Meme regle que subjectKey cote app (lib/onboardingLogic.ts), pour que
 * « Economie » et « Économie » ne fassent jamais deux matieres.
 */
export function subjectKey(name: string): string {
  return normalizeName(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function titleKey(title: string): string {
  return title.trim().toLowerCase()
}

export function isValidYmd(value: string): boolean {
  const match = value.match(YMD)
  if (!match) return false
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(y, m - 1, d))
  // 2026-02-31 glisserait au 3 mars : refuse plutot que deviner.
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/**
 * Titres de chapitres : espaces ecrases, doublons retires, rien d'autre. Les
 * puces et numeros nus sont deja retires par l'app (parseChapterList), et le
 * faire ici abimerait « 1.2 Les contrats », que l'app garde volontairement.
 */
export function cleanTitles(raw: unknown[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const title = item.replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE_LENGTH)
    if (!title) continue
    const key = titleKey(title)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(title)
    if (out.length >= MAX_TITLES_PER_SUBJECT) break
  }
  return out
}

export function parseChapters(raw: unknown): ChaptersInput {
  if (raw === undefined || raw === null) return { kind: 'none' }
  if (typeof raw !== 'object' || Array.isArray(raw)) throw new BadRequest('chapters invalide')
  const { titles, count } = raw as { titles?: unknown; count?: unknown }
  if (titles !== undefined && !Array.isArray(titles)) throw new BadRequest('chapters.titles doit être une liste')
  const cleaned = Array.isArray(titles) ? cleanTitles(titles) : []
  if (cleaned.length > 0) return { kind: 'titles', titles: cleaned }
  if (typeof count === 'number' && Number.isFinite(count) && count >= 1) {
    return { kind: 'count', count: Math.min(MAX_CHAPTER_COUNT, Math.round(count)) }
  }
  return { kind: 'none' }
}

/**
 * Reponses du questionnaire pour User.onboardingAnswers : valeurs simples et
 * listes de valeurs simples seulement. L'app envoie une liste blanche de cles
 * (ANSWER_KEYS), mais c'est un champ libre en base : on borne quand meme.
 */
export function sanitizeAnswers(raw: unknown): Prisma.InputJsonObject | undefined {
  if (raw === undefined || raw === null) return undefined
  if (typeof raw !== 'object' || Array.isArray(raw)) throw new BadRequest('answers invalide')
  const out: Record<string, Prisma.InputJsonValue | null> = {}
  let keys = 0
  for (const [rawKey, value] of Object.entries(raw)) {
    const key = rawKey.trim().slice(0, 80)
    if (!key) continue
    const clean = sanitizeAnswerValue(value)
    if (clean === undefined) continue
    out[key] = clean
    if (++keys >= MAX_ANSWER_KEYS) break
  }
  return out
}

function sanitizeAnswerValue(value: unknown): Prisma.InputJsonValue | null | undefined {
  if (value === null) return null
  if (typeof value === 'string') return value.slice(0, MAX_ANSWER_STRING)
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string | number | boolean =>
        typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))
      )
      .slice(0, MAX_ANSWER_ARRAY)
      .map((v) => (typeof v === 'string' ? v.slice(0, MAX_ANSWER_STRING) : v))
  }
  return undefined
}

export function parseRequest(body: unknown): PlanRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequest('Corps invalide')
  const raw = body as Record<string, unknown>

  const idempotencyKey = raw.idempotencyKey
  if (typeof idempotencyKey !== 'string' || !IDEMPOTENCY_KEY.test(idempotencyKey)) {
    throw new BadRequest('idempotencyKey invalide')
  }

  let examDate: string | null = null
  if (raw.examDate !== null && raw.examDate !== undefined) {
    if (typeof raw.examDate !== 'string' || !isValidYmd(raw.examDate)) throw new BadRequest('examDate invalide')
    examDate = raw.examDate
  }

  let classesEndHour: number | null = null
  if (raw.classesEndHour !== null && raw.classesEndHour !== undefined) {
    if (!(CLASSES_END_HOURS as readonly unknown[]).includes(raw.classesEndHour)) {
      throw new BadRequest('classesEndHour invalide')
    }
    classesEndHour = raw.classesEndHour as number
  }

  const rawSubjects = raw.subjects ?? []
  if (!Array.isArray(rawSubjects)) throw new BadRequest('subjects doit être une liste')
  if (rawSubjects.length > MAX_SUBJECTS) throw new BadRequest(`Maximum ${MAX_SUBJECTS} matières`)

  const seen = new Set<string>()
  const subjects: SubjectInput[] = []
  let totalChapters = 0
  for (const item of rawSubjects) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new BadRequest('Matière invalide')
    const { name, big, chapters } = item as { name?: unknown; big?: unknown; chapters?: unknown }
    if (typeof name !== 'string') throw new BadRequest('Nom de matière invalide')
    const clean = normalizeName(name)
    if (!clean) continue
    const key = subjectKey(clean)
    // Deux fois la meme matiere dans la requete : la premiere gagne, comme
    // cote app (buildPlanRequest).
    if (seen.has(key)) continue
    seen.add(key)
    const parsed = parseChapters(chapters)
    totalChapters += parsed.kind === 'titles' ? parsed.titles.length : parsed.kind === 'count' ? parsed.count : 0
    subjects.push({ name: clean, key, big: big === true, chapters: parsed })
  }
  if (totalChapters > MAX_TOTAL_CHAPTERS) throw new BadRequest(`Maximum ${MAX_TOTAL_CHAPTERS} chapitres`)

  return { idempotencyKey, examDate, subjects, classesEndHour, answers: sanitizeAnswers(raw.answers) }
}

// ---------------------------------------------------------------------------
// Creation (temps 1)
// ---------------------------------------------------------------------------

export interface ExistingSubject {
  id: string
  deadline: Date | null
  tasks: { title: string; completed: boolean; generated: boolean }[]
}

interface ChapterRow {
  title: string
  subjectId: string
  generated: boolean
}

function numbered(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`)
}

/**
 * Ce qu'il faut creer dans une matiere QUI EXISTE DEJA, sans rien dupliquer :
 *   - titres : seulement ceux qu'elle n'a pas (seances generiques en attente
 *     exclues de la comparaison, elles vont etre supprimees), et ses seances
 *     generiques en attente sont supprimees si au moins un vrai titre arrive,
 *     comme a l'import en masse ;
 *   - nombre : seulement si elle n'a encore AUCUN vrai chapitre. S'il y en a,
 *     ajouter « Chapitre 1 a N » doublerait le travail ;
 *   - rien (« pas encore ») : seances generiques seulement si elle n'a aucun
 *     chapitre en cours, sinon elle produit deja des blocs.
 */
export function mergeSubject(existing: ExistingSubject, chapters: ChaptersInput): { titles: string[]; generated: boolean; dropGenerated: boolean } {
  const real = existing.tasks.filter((t) => !t.generated)
  const pendingGenerated = existing.tasks.some((t) => t.generated && !t.completed)
  const hasOpenTask = existing.tasks.some((t) => !t.completed)

  if (chapters.kind === 'titles') {
    const known = new Set(real.map((t) => titleKey(t.title)))
    const titles = chapters.titles.filter((title) => !known.has(titleKey(title)))
    return { titles, generated: false, dropGenerated: titles.length > 0 && pendingGenerated }
  }
  if (chapters.kind === 'count') {
    if (real.length > 0) return { titles: [], generated: false, dropGenerated: false }
    return { titles: numbered('Chapitre', chapters.count), generated: false, dropGenerated: pendingGenerated }
  }
  if (hasOpenTask) return { titles: [], generated: false, dropGenerated: false }
  return { titles: numbered('Séance', GENERATED_SESSIONS), generated: true, dropGenerated: false }
}

export function titlesForNewSubject(chapters: ChaptersInput): { titles: string[]; generated: boolean } {
  if (chapters.kind === 'titles') return { titles: chapters.titles, generated: false }
  // Nombre approximatif : de vrais chapitres dont l'etudiant n'a pas donne le
  // titre (il les renomme dans l'app). PAS Task.generated : un seul chapitre
  // ajoute plus tard les supprimerait tous.
  if (chapters.kind === 'count') return { titles: numbered('Chapitre', chapters.count), generated: false }
  return { titles: numbered('Séance', GENERATED_SESSIONS), generated: true }
}

export interface CreationSummary {
  subjectsCreated: number
  subjectsReused: number
  chaptersCreated: number
  generatedCreated: number
}

/** null = cle deja enregistree : requete rejouee, rien n'a ete cree. */
export async function createFromRequest(
  userId: string,
  request: PlanRequest,
  timeZone: string,
  db: Pick<PrismaClient, '$transaction'> = prisma
): Promise<CreationSummary | null> {
  // Midi local du jour d'examen, pas minuit : le planificateur relit le JOUR
  // (localDateKey), et midi le garde meme si le fuseau du compte change ensuite
  // de quelques heures (voyage, premier /auth/me).
  const deadline = request.examDate ? localTime(request.examDate, '12:00', timeZone) : null
  const weeklyBusy = makeWeeklyBusy(request.classesEndHour)

  return db.$transaction(
    async (tx) => {
      // Premiere ecriture : la cle. Voir « Idempotence » en tete de
      // app/api/onboarding/plan/route.ts.
      // `not` seul ne prend pas les NULL en SQL, d'ou le OR.
      const claim = await tx.user.updateMany({
        where: { id: userId, OR: [{ onboardingPlanKey: null }, { onboardingPlanKey: { not: request.idempotencyKey } }] },
        data: {
          onboardingPlanKey: request.idempotencyKey,
          // Sans reponse a la question de secours, l'emploi du temps est efface :
          // c'est l'onboarding qui fait foi, pas une reponse d'une session precedente.
          weeklyBusy: weeklyBusy ? { classesEndHour: weeklyBusy.classesEndHour, days: weeklyBusy.days } : Prisma.DbNull,
          ...(request.answers !== undefined ? { onboardingAnswers: request.answers } : {}),
        },
      })
      if (claim.count === 0) return null

      const summary: CreationSummary = { subjectsCreated: 0, subjectsReused: 0, chaptersCreated: 0, generatedCreated: 0 }
      if (request.subjects.length === 0) return summary

      const existing = await tx.subject.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, deadline: true, tasks: { select: { title: true, completed: true, generated: true } } },
      })
      const existingByKey = new Map<string, ExistingSubject>()
      for (const subject of existing) {
        // Deux matieres existantes de meme cle (« Economie » et « Économie »,
        // creees dans l'app qui ne compare que la casse) : on reutilise la plus
        // ancienne, et on n'y touche pas davantage.
        const key = subjectKey(subject.name)
        if (!existingByKey.has(key)) existingByKey.set(key, subject)
      }

      const rows: ChapterRow[] = []
      for (const input of request.subjects) {
        const match = existingByKey.get(input.key)
        if (match) {
          summary.subjectsReused++
          if (deadline && !match.deadline) {
            await tx.subject.update({ where: { id: match.id }, data: { deadline } })
          }
          const plan = mergeSubject(match, input.chapters)
          if (plan.dropGenerated) await deleteGeneratedSessions(userId, match.id, tx)
          rows.push(...plan.titles.map((title) => ({ title, subjectId: match.id, generated: plan.generated })))
          continue
        }

        const created = await tx.subject.create({
          data: {
            name: input.name,
            coefficient: input.big ? BIG_COEFFICIENT : DEFAULT_COEFFICIENT,
            deadline,
            userId,
          },
          select: { id: true },
        })
        summary.subjectsCreated++
        const plan = titlesForNewSubject(input.chapters)
        rows.push(...plan.titles.map((title) => ({ title, subjectId: created.id, generated: plan.generated })))
      }

      if (rows.length > 0) {
        const order = calculateTaskOrder(`P${CHAPTER_PRIORITY}`, 'Moyen')
        // createdAt explicite, une milliseconde d'ecart : le planificateur place
        // les chapitres d'une matiere par (order, createdAt), et un createMany
        // donnerait la meme date a toutes les lignes. Sans ca, l'ordre de la
        // liste collee n'etait tenu que par le hasard des identifiants.
        const base = Date.now()
        await tx.task.createMany({
          data: rows.map((row, index) => ({
            title: row.title,
            description: '',
            priority: CHAPTER_PRIORITY,
            estimatedMinutes: CHAPTER_MINUTES,
            subjectId: row.subjectId,
            userId,
            completed: false,
            order,
            generated: row.generated,
            createdAt: new Date(base + index),
          })),
        })
        for (const row of rows) {
          if (row.generated) summary.generatedCreated++
          else summary.chaptersCreated++
        }
      }

      return summary
    },
    // Quelques dizaines d'insertions au plus : si ca depasse, quelque chose
    // bloque, et mieux vaut un 500 que tenir des verrous.
    { maxWait: 5000, timeout: 8000 }
  )
}

// ---------------------------------------------------------------------------
// Calcul (temps 2 et 3)
// ---------------------------------------------------------------------------

/** Budget du calcul sans Google que l'ecran attend. Au-dela : partial. */
export const QUICK_PLAN_MS = 3000
/** Budget du calcul complet en tache de fond (deux appels Google de 8 s au pire). */
export const FULL_PLAN_MS = 40_000

export const TIMED_OUT = Symbol('timed_out')

export interface PlanDeps {
  /** Calcul sans Google (temps 2). */
  quickReplan: (userId: string) => Promise<ReplanResult>
  /** Calcul complet avec Google (temps 3). null = echec ou delai depasse. */
  fullReplan: (userId: string) => Promise<ReplanResult | null>
  isGoogleConnected: (userId: string) => Promise<boolean>
  /** after() de next/server en production : tenu par Vercel apres la reponse. */
  schedule: (task: () => Promise<void>) => void
  quickBudgetMs: number
}

const defaultDeps: PlanDeps = {
  quickReplan: (userId) => replanUser(userId, 'onboarding', new Date(), { skipGoogle: true }),
  fullReplan: (userId) => replanUserSafely(userId, 'onboarding', FULL_PLAN_MS),
  isGoogleConnected: (userId) => googleCalendarService.isConnected(userId),
  schedule: (task) => after(task),
  quickBudgetMs: QUICK_PLAN_MS,
}

export interface PlanOutcome {
  /** Vrai si le calcul rapide n'a pas fini dans son budget, ou a echoue. */
  partial: boolean
  quick: ReplanResult | null | typeof TIMED_OUT
  ms: number
}

/**
 * Calcul sans Google borne a quickBudgetMs, puis calcul complet apres la
 * reponse.
 *
 * La tache de fond ATTEND la fin du calcul rapide, meme depasse, pour deux
 * raisons : c'est ce qui garde en vie un calcul rapide en retard (sans ca,
 * c'est une promesse non attendue, tuee par le gel Vercel des la reponse), et
 * sans ca les deux calculs ecriraient en meme temps, le rapide, sans Google,
 * pouvant arriver en dernier et reposer des seances sur un cours que le
 * complet avait evite.
 *
 * Le complet n'est lance que s'il apporte quelque chose : Google a lire, ou un
 * calcul rapide qui n'a pas abouti. Sinon il referait le meme calcul, et
 * ecrirait un second plan_generated pour rien.
 */
export async function planAndSchedule(userId: string, deps: Partial<PlanDeps> = {}): Promise<PlanOutcome> {
  const d: PlanDeps = { ...defaultDeps, ...deps }
  const startedAt = Date.now()
  const quick: Promise<ReplanResult | null> = d.quickReplan(userId).catch((error) => {
    console.error(`[onboarding/plan] calcul rapide echoue pour ${userId}`, error)
    return null
  })

  let timer: ReturnType<typeof setTimeout> | undefined
  const outcome = await Promise.race([
    quick,
    new Promise<typeof TIMED_OUT>((resolve) => {
      timer = setTimeout(() => resolve(TIMED_OUT), d.quickBudgetMs)
    }),
  ])
  clearTimeout(timer)

  d.schedule(async () => {
    const quickResult = await quick
    try {
      if (quickResult && !(await d.isGoogleConnected(userId))) return
      const full = await d.fullReplan(userId)
      console.log(
        `[onboarding/plan] calcul complet pour ${userId} :`,
        full ? `${full.blocksWritten} blocs, ${full.busySources.join(',')}` : 'echec'
      )
    } catch (error) {
      console.error(`[onboarding/plan] calcul complet impossible pour ${userId}`, error)
    }
  })

  return { partial: outcome === TIMED_OUT || outcome === null, quick: outcome, ms: Date.now() - startedAt }
}
