/**
 * Test des seances Mode Examen offertes, sans base :
 *   - lib/exam/freeSessions.ts (jeton signe, regle du delai) ;
 *   - les routes POST /api/exam/start, POST /api/exam/cancel, GET /api/auth/me
 *     et POST /api/user/product-events, appelees pour de vrai avec un faux
 *     client Prisma en memoire.
 *   npx tsx scripts/test-exam-free-sessions.ts
 *
 * Le faux client est pose sur globalThis.prisma AVANT le chargement des
 * routes : lib/prisma.ts reprend le client global s'il existe. Il reproduit
 * les UPDATE conditionnels (lt / gt, increment / decrement) tels que Postgres
 * les evalue, ligne par ligne. Ce qu'il ne prouve pas : l'atomicite reelle
 * sous concurrence, qui tient a Postgres (un seul UPDATE par decompte).
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-de-test-uniquement'
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test'

let failures = 0
let checks = 0

function check(label: string, condition: boolean, detail?: unknown) {
  checks++
  if (condition) {
    console.info(`  ok   ${label}`)
  } else {
    failures++
    console.info(`  FAIL ${label}`)
    if (detail !== undefined) console.info('       ', JSON.stringify(detail))
  }
}

// ---------------------------------------------------------------------------
// Faux client Prisma
// ---------------------------------------------------------------------------

type Row = Record<string, any>
const users = new Map<string, Row>()
const events: Row[] = []

function pick(row: Row, select?: Record<string, unknown>): Row {
  if (!select) return { ...row }
  const out: Row = {}
  for (const [key, wanted] of Object.entries(select)) if (wanted && key in row) out[key] = row[key]
  return out
}

function matches(row: Row, where: Row): boolean {
  for (const [key, cond] of Object.entries(where)) {
    if (cond !== null && typeof cond === 'object') {
      if ('lt' in cond && !(row[key] < cond.lt)) return false
      if ('gt' in cond && !(row[key] > cond.gt)) return false
    } else if (row[key] !== cond) {
      return false
    }
  }
  return true
}

function apply(row: Row, data: Row) {
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && typeof value === 'object' && 'increment' in value) row[key] += value.increment
    else if (value !== null && typeof value === 'object' && 'decrement' in value) row[key] -= value.decrement
    else row[key] = value
  }
}

const fakePrisma = {
  user: {
    async findUnique({ where, select }: any) {
      const row = users.get(where.id)
      return row ? pick(row, select) : null
    },
    async updateMany({ where, data }: any) {
      let count = 0
      for (const row of users.values()) {
        if (!matches(row, where)) continue
        apply(row, data)
        count++
      }
      return { count }
    },
    async update({ where, data }: any) {
      const row = users.get(where.id)!
      apply(row, data)
      return { ...row }
    },
  },
  userCompany: { async findFirst() { return null } },
  productAnalyticsEvent: {
    async create({ data }: any) {
      events.push(data)
      return data
    },
  },
}
;(globalThis as any).prisma = fakePrisma

function addUser(id: string, overrides: Row = {}) {
  users.set(id, {
    id,
    email: `${id}@example.test`,
    name: id,
    password: 'hash',
    tokenVersion: 0,
    whatsappNumber: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerifiedAt: new Date(),
    emailVerificationSentAt: null,
    managedCompanyId: null,
    subscriptionStatus: null,
    subscriptionTier: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionEndDate: null,
    convertedAt: null,
    cancelledAt: null,
    trialEndsAt: null,
    role: 'USER',
    timezone: 'Europe/Paris',
    examFreeUsed: 0,
    examFreeRefunded: 0,
    ...overrides,
  })
}

// ---------------------------------------------------------------------------

const { NextRequest } = await import('next/server')
const { sign, verify } = await import('../lib/jwt')
const tokens = await import('../lib/exam/freeSessions')
const plans = await import('../lib/plans')
const startRoute = await import('../app/api/exam/start/route')
const cancelRoute = await import('../app/api/exam/cancel/route')
const meRoute = await import('../app/api/auth/me/route')
const eventsRoute = await import('../app/api/user/product-events/route')

// getAuthUserFromRequest journalise chaque en-tete : on coupe console.log
// pendant les appels, le resultat du test passe par console.info.
async function quiet<T>(fn: () => Promise<T>): Promise<T> {
  const log = console.log
  const warn = console.warn
  console.log = () => {}
  console.warn = () => {}
  try {
    return await fn()
  } finally {
    console.log = log
    console.warn = warn
  }
}

async function jwtFor(userId: string) {
  return sign({ userId, email: `${userId}@example.test`, tokenVersion: 0 })
}

async function call(route: { POST?: any; GET?: any }, method: 'POST' | 'GET', userId: string | null, body?: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (userId) headers.authorization = `Bearer ${await jwtFor(userId)}`
  const req = new NextRequest('http://localhost/api/test', {
    method,
    headers,
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  })
  const res = await quiet(() => (method === 'POST' ? route.POST(req) : route.GET(req)))
  return { status: res.status as number, json: (await res.json()) as any }
}

// ---------------------------------------------------------------------------
console.info('\n1. Jeton de seance')
{
  const now = new Date('2026-09-26T10:00:00Z')
  const token = tokens.createFreeSessionToken('u1', now)
  const verified = tokens.verifyFreeSessionToken(token, 'u1', new Date(now.getTime() + 30_000))
  check('jeton valide relu avec son heure de depart', verified?.startedAt.getTime() === now.getTime())
  check('autre compte : refuse', tokens.verifyFreeSessionToken(token, 'u2', now) === null)
  const [payload, signature] = token.split('.')
  const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), iat: now.getTime() + 3_600_000 })).toString('base64url')
  check('heure de depart modifiee : refuse', tokens.verifyFreeSessionToken(`${forged}.${signature}`, 'u1', now) === null)
  check('signature modifiee : refuse', tokens.verifyFreeSessionToken(`${payload}.${signature.slice(0, -2)}AA`, 'u1', now) === null)
  check('deux jetons a la meme milliseconde : differents', tokens.createFreeSessionToken('u1', now) !== token)
  check('plus de 7 jours : refuse', tokens.verifyFreeSessionToken(token, 'u1', new Date(now.getTime() + 8 * 86_400_000)) === null)
  check('emis dans le futur au-dela de 60 s : refuse', tokens.verifyFreeSessionToken(token, 'u1', new Date(now.getTime() - 120_000)) === null)
  check('pas une chaine : refuse', tokens.verifyFreeSessionToken(42, 'u1', now) === null && tokens.verifyFreeSessionToken(undefined, 'u1', now) === null)
  check('forme libre : refuse sans lever', tokens.verifyFreeSessionToken('a.b.c', 'u1', now) === null && tokens.verifyFreeSessionToken('.', 'u1', now) === null)

  const jwt = await jwtFor('u1')
  check('un jeton de connexion ne passe pas pour un jeton de seance', tokens.verifyFreeSessionToken(jwt, 'u1', now) === null)
  const asJwt = await quiet(() => verify(token))
  check('un jeton de seance ne passe pas pour un jeton de connexion', asJwt === null)
}

// ---------------------------------------------------------------------------
console.info('\n2. Regle du delai')
{
  const start = new Date('2026-09-26T10:00:00Z')
  const at = (seconds: number) => new Date(start.getTime() + seconds * 1000)
  check('30 s sur les deux horloges : rendu', tokens.isInRefundWindow(30, start, at(32)))
  check('119 s : rendu', tokens.isInRefundWindow(119, start, at(125)))
  check('120 s pile : pas rendu', !tokens.isInRefundWindow(120, start, at(121)))
  check('l\'app dit 5 s, le serveur mesure une heure : pas rendu', !tokens.isInRefundWindow(5, start, at(3600)))
  check('reseau lent : 110 s cote app, 145 s cote serveur, rendu', tokens.isInRefundWindow(110, start, at(145)))
  check('au-dela de la marge serveur (150 s) : pas rendu', !tokens.isInRefundWindow(10, start, at(150)))
  check('temps negatif ou NaN : pas rendu', !tokens.isInRefundWindow(-1, start, at(5)) && !tokens.isInRefundWindow(Number.NaN, start, at(5)))
  check(`regle : ${plans.EXAM_FREE_SESSIONS} seances, ${plans.EXAM_FREE_REFUND_LIMIT} rendue, ${plans.EXAM_FREE_REFUND_WINDOW_SECONDS} s`,
    plans.EXAM_FREE_SESSIONS === 2 && plans.EXAM_FREE_REFUND_LIMIT === 1 && plans.EXAM_FREE_REFUND_WINDOW_SECONDS === 120)
  check('le gratuit n\'a PAS examModeEnabled (blocage automatique reste premium)', plans.getPlanLimits('free').examModeEnabled === false)
}

// ---------------------------------------------------------------------------
console.info('\n3. Routes, compte gratuit')
{
  addUser('free1')
  const me0 = await call(meRoute, 'GET', 'free1')
  check('/auth/me : 2 seances offertes', me0.status === 200 && me0.json.user.examFreeRemaining === 2, me0)
  check('/auth/me : compteur brut non expose', !('examFreeUsed' in me0.json.user))

  const s1 = await call(startRoute, 'POST', 'free1', { plannedMinutes: 30 })
  check('1re seance : autorisee, jeton, reste 1', s1.status === 200 && s1.json.allowed === true && s1.json.premium === false && typeof s1.json.sessionToken === 'string' && s1.json.freeRemaining === 1, s1)
  const s2 = await call(startRoute, 'POST', 'free1', { plannedMinutes: 30 })
  check('2e seance : autorisee, reste 0', s2.status === 200 && s2.json.allowed === true && s2.json.freeRemaining === 0, s2)
  const s3 = await call(startRoute, 'POST', 'free1', { plannedMinutes: 30 })
  check('3e seance : 403 quota_exhausted', s3.status === 403 && s3.json.allowed === false && s3.json.reason === 'quota_exhausted', s3)
  check('compteur plafonne a 2', users.get('free1')!.examFreeUsed === 2)

  const c1 = await call(cancelRoute, 'POST', 'free1', { sessionToken: s2.json.sessionToken, elapsedSeconds: 40 })
  check('annulation a 40 s : seance rendue, reste 1', c1.status === 200 && c1.json.refunded === true && c1.json.freeRemaining === 1, c1)
  const c2 = await call(cancelRoute, 'POST', 'free1', { sessionToken: s2.json.sessionToken, elapsedSeconds: 40 })
  check('meme annulation rejouee : rien de plus', c2.status === 200 && c2.json.refunded === false && c2.json.freeRemaining === 1, c2)
  const s4 = await call(startRoute, 'POST', 'free1', { plannedMinutes: 25 })
  check('seance rendue relancable, reste 0', s4.status === 200 && s4.json.allowed === true && s4.json.freeRemaining === 0, s4)
  const c3 = await call(cancelRoute, 'POST', 'free1', { sessionToken: s4.json.sessionToken, elapsedSeconds: 10 })
  check('2e annulation rapide : PAS rendue (une seule fois par compte)', c3.json.refunded === false && c3.json.freeRemaining === 0, c3)
  const me1 = await call(meRoute, 'GET', 'free1')
  check('/auth/me apres : 0 seance', me1.json.user.examFreeRemaining === 0)
  const u = users.get('free1')!
  check('compteurs en base : 2 utilisees net, 1 rendue', u.examFreeUsed === 2 && u.examFreeRefunded === 1, u)
}

// ---------------------------------------------------------------------------
console.info('\n4. Routes, annulations refusees')
{
  addUser('free2')
  const s = await call(startRoute, 'POST', 'free2', { plannedMinutes: 30 })
  const late = await call(cancelRoute, 'POST', 'free2', { sessionToken: s.json.sessionToken, elapsedSeconds: 150 })
  check('annulation a 150 s : pas rendue', late.status === 200 && late.json.refunded === false && late.json.freeRemaining === 1, late)
  const old = tokens.createFreeSessionToken('free2', new Date(Date.now() - 5 * 60_000))
  const lying = await call(cancelRoute, 'POST', 'free2', { sessionToken: old, elapsedSeconds: 5 })
  check('jeton de 5 min, l\'app annonce 5 s : pas rendue', lying.json.refunded === false, lying)
  const other = await call(cancelRoute, 'POST', 'free2', { sessionToken: tokens.createFreeSessionToken('free1'), elapsedSeconds: 5 })
  check('jeton d\'un autre compte : 400', other.status === 400 && other.json.refunded === false, other)
  const garbage = await call(cancelRoute, 'POST', 'free2', { sessionToken: 'nimportequoi', elapsedSeconds: 5 })
  check('jeton invalide : 400', garbage.status === 400)
  const noElapsed = await call(cancelRoute, 'POST', 'free2', { sessionToken: s.json.sessionToken })
  check('elapsedSeconds absent : 400', noElapsed.status === 400)
  check('aucun remboursement ecrit', users.get('free2')!.examFreeRefunded === 0 && users.get('free2')!.examFreeUsed === 1)

  const bad = await call(startRoute, 'POST', 'free2', { plannedMinutes: 0 })
  const badType = await call(startRoute, 'POST', 'free2', { plannedMinutes: '30' })
  check('plannedMinutes invalide : 400, rien de decompte', bad.status === 400 && badType.status === 400 && users.get('free2')!.examFreeUsed === 1)
  const anon = await call(startRoute, 'POST', null, { plannedMinutes: 30 })
  check('sans connexion : 401', anon.status === 401)
}

// ---------------------------------------------------------------------------
console.info('\n5. Routes, compte premium')
{
  addUser('pro1', { subscriptionStatus: 'active', subscriptionTier: 'premium' })
  for (let i = 0; i < 3; i++) await call(startRoute, 'POST', 'pro1', { plannedMinutes: 60 })
  const s = await call(startRoute, 'POST', 'pro1', { plannedMinutes: 60 })
  check('premium : toujours autorise, pas de jeton ni de compteur', s.status === 200 && s.json.allowed && s.json.premium === true && s.json.sessionToken === null && s.json.freeRemaining === null, s)
  check('premium : rien decompte', users.get('pro1')!.examFreeUsed === 0)
  const c = await call(cancelRoute, 'POST', 'pro1', { sessionToken: null, elapsedSeconds: 10 })
  check('premium : annulation sans objet', c.status === 200 && c.json.refunded === false && c.json.freeRemaining === null, c)
  const me = await call(meRoute, 'GET', 'pro1')
  check('/auth/me premium : examFreeRemaining null', me.json.user.examFreeRemaining === null && me.json.user.isPremium === true, me.json.user)

  // Devenu premium apres avoir consomme : le compteur n'est plus lu.
  addUser('upgraded', { examFreeUsed: 2, subscriptionStatus: 'trialing' })
  const up = await call(startRoute, 'POST', 'upgraded', { plannedMinutes: 30 })
  check('essai en cours apres 2 seances offertes : autorise', up.json.allowed === true && up.json.premium === true)
}

// ---------------------------------------------------------------------------
console.info('\n6. Liste blanche des evenements')
{
  addUser('ev1')
  const names = [
    'onboarding_step_viewed',
    'onboarding_step_completed',
    'onboarding_calendar_choice',
    'onboarding_plan_built',
    'trial_cta_tapped',
    'paywall_skipped',
    'purchase_completed',
    'exam_free_session_started',
    'exam_free_session_completed',
    'first_planned_block_started',
  ]
  let accepted = 0
  for (const eventName of names) {
    const res = await call(eventsRoute, 'POST', 'ev1', { eventName, params: { step: 'exams', index: 9 } })
    if (res.status === 200) accepted++
  }
  check(`les ${names.length} evenements du contrat sont acceptes`, accepted === names.length, { accepted })
  check('params gardes', JSON.stringify(events[0]?.params) === JSON.stringify({ step: 'exams', index: 9 }), events[0])
  const refused = await call(eventsRoute, 'POST', 'ev1', { eventName: 'onboarding_hack' })
  check('evenement inconnu : 400', refused.status === 400)
}

console.info(`\n${checks - failures}/${checks} verifications passees`)
if (failures > 0) process.exit(1)
