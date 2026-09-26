/**
 * Test de lib/planning/onboardingPlan.ts (temps 1 de POST /api/onboarding/plan),
 * sans base : un faux client Prisma en memoire joue la transaction.
 *   npx tsx scripts/test-onboarding-plan.ts
 *
 * Les temps 2 et 3 (calcul borne puis calcul complet apres la reponse) sont
 * testes avec des calculs simules et un after() capture (section 6) : le vrai
 * after() de next/server leve hors d'une requete. Le planificateur, lui, est
 * rejoue sur les donnees creees (section 5).
 *
 * Meme convention que scripts/test-study-planner.ts : pas de runner, on execute
 * et on lit le resultat.
 */

import { Prisma } from '@prisma/client'
import { planStudy, localDateKey, type PlannerSubject, type PlannerTask } from '../lib/planning/StudyPlanner'
import {
  BadRequest,
  BIG_COEFFICIENT,
  DEFAULT_COEFFICIENT,
  GENERATED_SESSIONS,
  createFromRequest,
  mergeSubject,
  parseRequest,
  planAndSchedule,
  subjectKey,
  TIMED_OUT,
  titlesForNewSubject,
} from '../lib/planning/onboardingPlan'
import type { ReplanResult } from '../lib/planning/autoPlan'

let failures = 0
let checks = 0

function check(label: string, condition: boolean, detail?: unknown) {
  checks++
  if (condition) {
    console.log(`  ok   ${label}`)
  } else {
    failures++
    console.log(`  FAIL ${label}`)
    if (detail !== undefined) console.log('       ', JSON.stringify(detail))
  }
}

function rejects(label: string, body: unknown) {
  try {
    parseRequest(body)
    check(label, false, 'aucune erreur')
  } catch (error) {
    check(label, error instanceof BadRequest, String(error))
  }
}

const PARIS = 'Europe/Paris'
const MTL = 'America/Toronto'
const KEY = '3f1c2d9e-1111-4222-8333-944455556666'

// ---------------------------------------------------------------------------
// Faux client : juste ce que createFromRequest appelle, avec les memes regles
// de filtre que Postgres pour les cas utilises.
// ---------------------------------------------------------------------------

interface FakeUser {
  id: string
  onboardingPlanKey: string | null
  onboardingAnswers: unknown
  weeklyBusy: unknown
}
interface FakeSubject {
  id: string
  userId: string
  name: string
  coefficient: number
  deadline: Date | null
}
interface FakeTask {
  id: string
  userId: string
  subjectId: string | null
  title: string
  completed: boolean
  generated: boolean
  estimatedMinutes: number | null
  order: number
  createdAt: Date
  priority: number | null
}
interface FakeState {
  users: FakeUser[]
  subjects: FakeSubject[]
  tasks: FakeTask[]
  seq: number
}

function fakeDb(state: FakeState) {
  const tx = {
    user: {
      async updateMany({ where, data }: any) {
        let count = 0
        for (const user of state.users) {
          if (user.id !== where.id) continue
          const keyOk = where.OR.some((cond: any) =>
            cond.onboardingPlanKey === null
              ? user.onboardingPlanKey === null
              : // `not` en SQL : NULL <> x est NULL, donc faux.
                user.onboardingPlanKey !== null && user.onboardingPlanKey !== cond.onboardingPlanKey.not
          )
          if (!keyOk) continue
          user.onboardingPlanKey = data.onboardingPlanKey
          user.weeklyBusy = data.weeklyBusy === Prisma.DbNull ? null : data.weeklyBusy
          if ('onboardingAnswers' in data) user.onboardingAnswers = data.onboardingAnswers
          count++
        }
        return { count }
      },
    },
    subject: {
      async findMany({ where }: any) {
        return state.subjects
          .filter((s) => s.userId === where.userId)
          .map((s) => ({
            ...s,
            tasks: state.tasks
              .filter((t) => t.subjectId === s.id)
              .map((t) => ({ title: t.title, completed: t.completed, generated: t.generated })),
          }))
      },
      async create({ data }: any) {
        const subject: FakeSubject = { id: `s${++state.seq}`, ...data }
        state.subjects.push(subject)
        return { id: subject.id }
      },
      async update({ where, data }: any) {
        const subject = state.subjects.find((s) => s.id === where.id)!
        Object.assign(subject, data)
        return subject
      },
    },
    task: {
      async deleteMany({ where }: any) {
        const before = state.tasks.length
        state.tasks = state.tasks.filter(
          (t) =>
            !(
              t.userId === where.userId &&
              t.subjectId === where.subjectId &&
              t.generated === where.generated &&
              t.completed === where.completed
            )
        )
        return { count: before - state.tasks.length }
      },
      async createMany({ data }: any) {
        for (const row of data) state.tasks.push({ id: `t${++state.seq}`, ...row })
        return { count: data.length }
      },
    },
  }
  return {
    // Transaction : tout ou rien, comme Postgres.
    async $transaction(fn: (t: typeof tx) => Promise<unknown>) {
      const snapshot = structuredClone(state)
      try {
        return await fn(tx)
      } catch (error) {
        Object.assign(state, snapshot)
        throw error
      }
    },
  } as any
}

function newState(): FakeState {
  return { users: [{ id: 'u1', onboardingPlanKey: null, onboardingAnswers: null, weeklyBusy: null }], subjects: [], tasks: [], seq: 0 }
}

function baseBody(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: KEY,
    examDate: '2026-12-15',
    classesEndHour: 16,
    subjects: [
      { name: 'Anatomie', big: true, chapters: { titles: ['Os du crâne', 'Membre supérieur', 'Membre inférieur'] } },
      { name: 'Chimie', big: false, chapters: { count: 4 } },
      { name: 'SHS', big: false },
    ],
    answers: { studentType: 'university', dailyStruggles: ['phone', 'procrastination'], focusQuality: 3 },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
console.log('\n1. Lecture de la requete')
{
  const request = parseRequest(baseBody())
  check('cle, date et heure de fin gardees', request.idempotencyKey === KEY && request.examDate === '2026-12-15' && request.classesEndHour === 16)
  check('3 matieres', request.subjects.length === 3)
  check('titres gardes dans l\'ordre', JSON.stringify(request.subjects[0].chapters) === JSON.stringify({ kind: 'titles', titles: ['Os du crâne', 'Membre supérieur', 'Membre inférieur'] }))
  check('nombre de chapitres', JSON.stringify(request.subjects[1].chapters) === JSON.stringify({ kind: 'count', count: 4 }))
  check('pas de chapitres = none', request.subjects[2].chapters.kind === 'none')
  check('big strict', request.subjects[0].big === true && request.subjects[1].big === false)

  const dup = parseRequest(baseBody({ subjects: [{ name: 'Économie', big: true }, { name: '  economie ', big: false }, { name: 'ÉCONOMIE' }] }))
  check('« Économie » et « economie » : une seule matiere, la premiere gagne', dup.subjects.length === 1 && dup.subjects[0].big === true, dup.subjects)
  check('cle insensible aux accents', subjectKey('Économie') === subjectKey('economie'))

  const titles = parseRequest(baseBody({ subjects: [{ name: 'Droit', chapters: { titles: ['  1.2 Les contrats ', 'Les   contrats', '1.2 les contrats', '', 42, 'Responsabilité'] } }] }))
  check('« 1.2 Les contrats » garde sa numerotation, doublons et non-textes retires',
    JSON.stringify((titles.subjects[0].chapters as any).titles) === JSON.stringify(['1.2 Les contrats', 'Les contrats', 'Responsabilité']),
    titles.subjects[0].chapters)

  const empty = parseRequest(baseBody({ subjects: [{ name: 'Droit', chapters: { titles: ['', '  '], count: 7 } }] }))
  check('titres vides : repli sur le nombre', JSON.stringify(empty.subjects[0].chapters) === JSON.stringify({ kind: 'count', count: 7 }))
  const big = parseRequest(baseBody({ subjects: [{ name: 'Droit', chapters: { count: 500 } }] }))
  check('nombre plafonne a 120', (big.subjects[0].chapters as any).count === 120)
  const zero = parseRequest(baseBody({ subjects: [{ name: 'Droit', chapters: { count: 0 } }] }))
  check('nombre 0 = pas encore', zero.subjects[0].chapters.kind === 'none')
  const many = parseRequest(baseBody({ subjects: [{ name: 'Droit', chapters: { titles: Array.from({ length: 250 }, (_, i) => `Ch ${i}`) } }] }))
  check('titres tronques a 200 par matiere', (many.subjects[0].chapters as any).titles.length === 200)
  const blank = parseRequest(baseBody({ subjects: [{ name: '   ' }, { name: 'Droit' }] }))
  check('nom vide ignore', blank.subjects.length === 1)

  check('date null acceptee', parseRequest(baseBody({ examDate: null })).examDate === null)
  check('heure null acceptee', parseRequest(baseBody({ classesEndHour: null })).classesEndHour === null)
  check('subjects absent = aucune matiere', parseRequest({ idempotencyKey: KEY, examDate: null, classesEndHour: null }).subjects.length === 0)

  const answers = parseRequest(baseBody({ answers: { a: 'x'.repeat(900), b: [1, 'deux', { trois: 3 }, true, Number.NaN], c: { nested: true }, d: null, e: Number.POSITIVE_INFINITY } })).answers as any
  check('reponses : chaine tronquee a 500', answers.a.length === 500)
  check('reponses : liste filtree', JSON.stringify(answers.b) === JSON.stringify([1, 'deux', true]), answers.b)
  check('reponses : objet imbrique et infini retires, null garde', !('c' in answers) && !('e' in answers) && answers.d === null, answers)
  check('reponses absentes = undefined (on ne touche pas au champ)', parseRequest(baseBody({ answers: undefined })).answers === undefined)

  rejects('cle absente', baseBody({ idempotencyKey: undefined }))
  rejects('cle trop courte', baseBody({ idempotencyKey: 'abc' }))
  rejects('date mal formee', baseBody({ examDate: '15/12/2026' }))
  rejects('date impossible (31 fevrier)', baseBody({ examDate: '2027-02-31' }))
  rejects('heure hors des 4 reponses', baseBody({ classesEndHour: 15 }))
  rejects('subjects pas une liste', baseBody({ subjects: 'Anatomie' }))
  rejects('plus de 20 matieres', baseBody({ subjects: Array.from({ length: 21 }, (_, i) => ({ name: `M${i}` })) }))
  rejects('plus de 1500 chapitres', baseBody({ subjects: Array.from({ length: 13 }, (_, i) => ({ name: `M${i}`, chapters: { count: 120 } })) }))
  rejects('nom pas une chaine', baseBody({ subjects: [{ name: 12 }] }))
  rejects('answers en liste', baseBody({ answers: ['a'] }))
  rejects('corps absent', null)
}

// ---------------------------------------------------------------------------
console.log('\n2. Matiere neuve')
{
  check('titres : vrais chapitres', JSON.stringify(titlesForNewSubject({ kind: 'titles', titles: ['A', 'B'] })) === JSON.stringify({ titles: ['A', 'B'], generated: false }))
  const counted = titlesForNewSubject({ kind: 'count', count: 3 })
  check('nombre : « Chapitre 1 a N », PAS generes', counted.generated === false && counted.titles.join('|') === 'Chapitre 1|Chapitre 2|Chapitre 3')
  const none = titlesForNewSubject({ kind: 'none' })
  check(`pas encore : ${GENERATED_SESSIONS} seances generees`, none.generated === true && none.titles.length === GENERATED_SESSIONS && none.titles[0] === 'Séance 1')
}

// ---------------------------------------------------------------------------
console.log('\n3. Matiere deja existante (fusion)')
{
  const withChapters = { id: 's', deadline: null, tasks: [{ title: 'Les contrats', completed: false, generated: false }, { title: 'La preuve', completed: true, generated: false }] }
  const merged = mergeSubject(withChapters, { kind: 'titles', titles: ['les contrats', 'La preuve', 'La responsabilité'] })
  check('titres : seuls les nouveaux, termines compris dans la comparaison', merged.titles.join('|') === 'La responsabilité' && !merged.dropGenerated, merged)
  check('nombre sur une matiere qui a de vrais chapitres : rien', mergeSubject(withChapters, { kind: 'count', count: 5 }).titles.length === 0)
  check('pas encore sur une matiere qui a des chapitres en cours : rien', mergeSubject(withChapters, { kind: 'none' }).titles.length === 0)

  const onlyGenerated = { id: 's', deadline: null, tasks: [{ title: 'Séance 1', completed: false, generated: true }] }
  const replaced = mergeSubject(onlyGenerated, { kind: 'titles', titles: ['Séance 1', 'Chapitre A'] })
  check('seances generees en attente : supprimees quand de vrais titres arrivent, meme de meme titre',
    replaced.dropGenerated && replaced.titles.join('|') === 'Séance 1|Chapitre A', replaced)
  const counted = mergeSubject(onlyGenerated, { kind: 'count', count: 2 })
  check('nombre sur une matiere qui n\'a que des seances generees : les remplace', counted.dropGenerated && counted.titles.length === 2)
  check('pas encore sur une matiere qui a deja ses seances generees : rien', mergeSubject(onlyGenerated, { kind: 'none' }).titles.length === 0)

  const allDone = { id: 's', deadline: null, tasks: [{ title: 'Fini', completed: true, generated: false }] }
  check('pas encore sur une matiere entierement terminee : seances generees', mergeSubject(allDone, { kind: 'none' }).generated === true)
  check('matiere vide : seances generees', mergeSubject({ id: 's', deadline: null, tasks: [] }, { kind: 'none' }).titles.length === GENERATED_SESSIONS)
}

// ---------------------------------------------------------------------------
console.log('\n4. Transaction de creation')
{
  const state = newState()
  const request = parseRequest(baseBody())
  const summary = await createFromRequest('u1', request, PARIS, fakeDb(state))
  check('resume', JSON.stringify(summary) === JSON.stringify({ subjectsCreated: 3, subjectsReused: 0, chaptersCreated: 7, generatedCreated: 6 }), summary)
  const [anat, chim, shs] = state.subjects
  check(`coefficients ${BIG_COEFFICIENT} / ${DEFAULT_COEFFICIENT}`, anat.coefficient === BIG_COEFFICIENT && chim.coefficient === DEFAULT_COEFFICIENT && shs.coefficient === DEFAULT_COEFFICIENT)
  check('date d\'examen = le jour local demande', state.subjects.every((s) => s.deadline && localDateKey(s.deadline, PARIS) === '2026-12-15'))
  check('date posee a midi local', anat.deadline?.toISOString() === '2026-12-15T11:00:00.000Z', anat.deadline)
  check('chapitres a 30 min', state.tasks.every((t) => t.estimatedMinutes === 30))
  check('seances generees seulement pour SHS', state.tasks.filter((t) => t.generated).every((t) => t.subjectId === shs.id))
  const anatTasks = state.tasks.filter((t) => t.subjectId === anat.id)
  check('createdAt croissant dans l\'ordre de la liste', anatTasks.map((t) => t.title).join('|') === 'Os du crâne|Membre supérieur|Membre inférieur' &&
    anatTasks.every((t, i) => i === 0 || t.createdAt.getTime() > anatTasks[i - 1].createdAt.getTime()))
  check('meme order pour tous (tri par createdAt)', new Set(state.tasks.map((t) => t.order)).size === 1)
  const user = state.users[0]
  check('cle enregistree', user.onboardingPlanKey === KEY)
  check('emploi du temps de secours ecrit', JSON.stringify(user.weeklyBusy) === JSON.stringify({ classesEndHour: 16, days: [1, 2, 3, 4, 5] }), user.weeklyBusy)
  check('reponses ecrites', (user.onboardingAnswers as any)?.dailyStruggles?.length === 2)

  // Rejouee : meme cle, rien de neuf.
  const again = await createFromRequest('u1', request, PARIS, fakeDb(state))
  check('requete rejouee : null, rien de cree', again === null && state.subjects.length === 3 && state.tasks.length === 13)

  // Nouvelle cle (reinstallation) avec des matieres deja la.
  const second = parseRequest(baseBody({
    idempotencyKey: 'aaaaaaaa-2222-4222-8333-944455556666',
    examDate: '2027-01-20',
    classesEndHour: null,
    answers: undefined,
    subjects: [
      { name: 'anatomie', big: false, chapters: { titles: ['Os du crâne', 'Thorax'] } },
      { name: 'SHS', chapters: { titles: ['Éthique'] } },
      { name: 'Biophysique', big: true },
    ],
  }))
  const merged = await createFromRequest('u1', second, PARIS, fakeDb(state))
  check('resume fusion', JSON.stringify(merged) === JSON.stringify({ subjectsCreated: 1, subjectsReused: 2, chaptersCreated: 2, generatedCreated: 6 }), merged)
  check('aucune matiere en double', state.subjects.length === 4 && state.subjects.filter((s) => subjectKey(s.name) === 'anatomie').length === 1)
  check('coefficient existant garde (big: false ignore)', state.subjects[0].coefficient === BIG_COEFFICIENT)
  check('date existante gardee', localDateKey(state.subjects[0].deadline!, PARIS) === '2026-12-15')
  check('« Os du crâne » pas recree, « Thorax » ajoute', state.tasks.filter((t) => t.subjectId === anat.id).map((t) => t.title).join('|') === 'Os du crâne|Membre supérieur|Membre inférieur|Thorax')
  check('SHS : seances generees supprimees, vrai chapitre ajoute', state.tasks.filter((t) => t.subjectId === shs.id).map((t) => `${t.title}:${t.generated}`).join('|') === 'Éthique:false')
  check('nouvelle matiere avec la nouvelle date', localDateKey(state.subjects[3].deadline!, PARIS) === '2027-01-20')
  check('sans reponse a la question de secours : emploi du temps efface', state.users[0].weeklyBusy === null)
  check('answers absentes : reponses precedentes gardees', (state.users[0].onboardingAnswers as any)?.focusQuality === 3)

  // Montreal : la date est le jour LOCAL de Montreal.
  const mtl = newState()
  await createFromRequest('u1', parseRequest(baseBody({ subjects: [{ name: 'Droit' }] })), MTL, fakeDb(mtl))
  check('Montreal : le jour local est garde', localDateKey(mtl.subjects[0].deadline!, MTL) === '2026-12-15' && localDateKey(mtl.subjects[0].deadline!, PARIS) === '2026-12-15')

  // Sans date : pas de date inventee.
  const nodate = newState()
  await createFromRequest('u1', parseRequest(baseBody({ examDate: null })), PARIS, fakeDb(nodate))
  check('« je ne sais pas » : matieres sans date', nodate.subjects.every((s) => s.deadline === null))

  // Aucune matiere : la cle et les reponses sont quand meme ecrites.
  const nothing = newState()
  const res = await createFromRequest('u1', parseRequest(baseBody({ subjects: [] })), PARIS, fakeDb(nothing))
  check('aucune matiere : rien de cree, cle posee', JSON.stringify(res) === JSON.stringify({ subjectsCreated: 0, subjectsReused: 0, chaptersCreated: 0, generatedCreated: 0 }) && nothing.users[0].onboardingPlanKey === KEY)

  // Echec au milieu : tout est annule, la cle comprise, un nouvel essai recree.
  const broken = newState()
  const db = fakeDb(broken)
  const realTransaction = db.$transaction
  let calls = 0
  db.$transaction = (fn: any) => realTransaction((tx: any) => {
    const create = tx.task.createMany
    tx.task.createMany = async (args: any) => {
      if (calls++ === 0) throw new Error('coupure')
      return create(args)
    }
    return fn(tx)
  })
  let threw = false
  try {
    await createFromRequest('u1', request, PARIS, db)
  } catch {
    threw = true
  }
  check('echec : rien d\'ecrit, cle non posee', threw && broken.subjects.length === 0 && broken.users[0].onboardingPlanKey === null)
  const retry = await createFromRequest('u1', request, PARIS, db)
  check('nouvel essai apres echec : cree', retry?.subjectsCreated === 3 && broken.subjects.length === 3)
}

// ---------------------------------------------------------------------------
console.log('\n5. Le planificateur sur les donnees creees')
{
  const state = newState()
  await createFromRequest('u1', parseRequest(baseBody()), PARIS, fakeDb(state))
  const subjects: PlannerSubject[] = state.subjects.map((s) => ({ id: s.id, name: s.name, coefficient: s.coefficient, deadline: s.deadline }))
  const tasks: PlannerTask[] = state.tasks.map((t) => ({
    id: t.id,
    subjectId: t.subjectId as string,
    estimatedMinutes: t.estimatedMinutes,
    dueDate: null,
    order: t.order,
    createdAt: t.createdAt,
  }))
  const now = new Date('2026-09-28T07:00:00Z') // lundi 9h a Paris
  const plan = planStudy(subjects, tasks, [], { now, timeZone: PARIS, horizonDays: 14 })
  const placedSubjects = new Set(plan.blocks.map((b) => b.subjectId))
  check('les 3 matieres ont des blocs, SHS par ses seances generees', placedSubjects.size === 3, [...placedSubjects])
  const anatId = state.subjects[0].id
  const firstAnat = plan.blocks.filter((b) => b.subjectId === anatId).sort((a, b) => a.start.getTime() - b.start.getTime())[0]
  const firstTitle = state.tasks.find((t) => t.id === firstAnat?.taskId)?.title
  check('le premier bloc d\'Anatomie est le premier chapitre de la liste', firstTitle === 'Os du crâne', firstTitle)
  check('tous les chapitres places (13 x 30 min sur 14 jours)', plan.blocks.length === 13, plan.summary)
}

// ---------------------------------------------------------------------------
console.log('\n6. Calcul borne puis calcul complet apres la reponse')
{
  const result = (label: string): ReplanResult => ({ userId: 'u1', reason: 'onboarding', blocksWritten: 3, unscheduled: 0, unplaced: 0, catchUp: false, busySources: [label] })
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  function harness(opts: { quickMs: number; quickFails?: boolean; google: boolean; fullMs?: number }) {
    const log: string[] = []
    let scheduled: (() => Promise<void>) | null = null
    const deps = {
      quickBudgetMs: 60,
      googleBudgetMs: 60,
      quickReplan: async () => {
        log.push('quick:start')
        await sleep(opts.quickMs)
        if (opts.quickFails) throw new Error('panne')
        log.push('quick:end')
        return result('google_skipped')
      },
      fullReplan: async () => {
        log.push('full:start')
        await sleep(opts.fullMs ?? 5)
        log.push('full:end')
        return result('google')
      },
      isGoogleConnected: async () => opts.google,
      schedule: (task: () => Promise<void>) => {
        scheduled = task
      },
    }
    return { deps, log, run: async () => { if (scheduled) await scheduled() } }
  }

  const quiet = console.error
  console.error = () => {}
  const logOut = console.log
  console.log = (...args: unknown[]) => { if (typeof args[0] === 'string' && args[0].startsWith('[onboarding/plan]')) return; logOut(...args) }

  {
    const h = harness({ quickMs: 5, google: false })
    const out = await planAndSchedule('u1', h.deps)
    check('rapide dans le budget : partial false, resultat rendu', out.partial === false && out.quick !== TIMED_OUT && out.quick !== null)
    await h.run()
    check('sans Google : pas de calcul complet (il referait le meme)', !h.log.includes('full:start'), h.log)
  }
  {
    const h = harness({ quickMs: 5, google: true })
    const out = await planAndSchedule('u1', h.deps)
    check('avec Google : le calcul COMPLET est fait avant la reponse, sans le rapide',
      h.log.join(',') === 'full:start,full:end' && out.partial === false && out.quick !== TIMED_OUT && out.quick !== null && (out.quick as ReplanResult).busySources.includes('google'), h.log)
    await h.run()
    check('avec Google : rien de plus apres la reponse', h.log.join(',') === 'full:start,full:end', h.log)
  }
  {
    const h = harness({ quickMs: 5, google: true, fullMs: 150 })
    const before = Date.now()
    const out = await planAndSchedule('u1', h.deps)
    const waited = Date.now() - before
    check('Google lent : partial true, la route rend la main au budget Google', out.partial === true && waited < 140, { waited })
    await h.run()
    check('Google lent : le complet est garde en vie jusqu\'au bout, jamais le rapide', h.log.join(',') === 'full:start,full:end', h.log)
  }
  {
    const h = harness({ quickMs: 150, google: false })
    const before = Date.now()
    const out = await planAndSchedule('u1', h.deps)
    const waited = Date.now() - before
    check('rapide trop lent : partial true, la route rend la main au budget', out.partial === true && out.quick === TIMED_OUT && waited < 140, { waited })
    check('rien du complet avant la reponse', !h.log.includes('full:start'))
    await h.run()
    check('rapide depasse sans Google : la tache de fond le garde en vie jusqu\'au bout, pas de complet',
      h.log.join(',') === 'quick:start,quick:end', h.log)
  }

  {
    const h = harness({ quickMs: 5, quickFails: true, google: false })
    const out = await planAndSchedule('u1', h.deps)
    check('rapide en panne : partial true, pas d\'exception', out.partial === true && out.quick === null)
    await h.run()
    check('rapide en panne : le complet rattrape', h.log.includes('full:end'), h.log)
  }
  {
    const h = harness({ quickMs: 5, google: true })
    h.deps.fullReplan = async () => { throw new Error('Google HS') }
    const out = await planAndSchedule('u1', h.deps)
    check('Google en panne : repli sur le calcul rapide, rendu a l\'ecran', out.partial === false && h.log.includes('quick:end'), h.log)
    let threw = false
    try { await h.run() } catch { threw = true }
    check('complet en panne : la tache de fond ne leve pas', !threw)
  }

  console.error = quiet
  console.log = logOut
}

console.log(`\n${checks - failures}/${checks} verifications passees`)
if (failures > 0) process.exit(1)
