/**
 * Test de la logique pure de la seconde moitie de l'onboarding 1.5 (calcul,
 * planning, essai, sorties du paywall, reprise), sans simulateur.
 *   ./node_modules/.bin/tsx mobile-app-new/scripts/test-onboarding-plan-view.ts   (depuis la racine du depot)
 *
 * Meme convention que test-onboarding-logic.ts : pas de runner, on execute et
 * on lit le resultat. Les dates sont construites en heure LOCALE, comme sur le
 * telephone : a lancer aussi avec TZ=America/Toronto ou TZ=Pacific/Auckland.
 */

import {
  autoBlockResultCopy,
  blockLabel,
  busyLineForDay,
  decideTrialExit,
  examParamsForBlock,
  formatHour,
  freeSessionsTitle,
  groupBlocksByDay,
  isPlanTimeout,
  localDayOffset,
  nextBlockToLock,
  planInsights,
  readTraits,
  resumeRouteFor,
  summarizePlan,
  trialHeadline,
  trialInsights,
  upcomingBlocks,
  type Copy,
  type PlanBlock,
} from '../lib/onboardingPlanView'

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

const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Meme remplacement que t() (contexts/LanguageContext.tsx) quand la cle n'est pas traduite. */
function render(copy: Copy): string {
  let text = copy.fallback
  for (const [key, value] of Object.entries(copy.params ?? {})) {
    text = text.replace(`{${key}}`, String(value))
  }
  return text
}

// Tous les textes produits passent par ici : aucun ne doit contenir « essai »
// (regle Apple 3.1.2, seul le paywall Superwall connait l'eligibilite) ni
// garder un {parametre} non remplace.
const allRendered: string[] = []
function seen(copy: Copy): string {
  const text = render(copy)
  allRendered.push(text)
  return text
}

// Mardi 29 septembre 2026, 21h00, heure locale.
const now = new Date(2026, 8, 29, 21, 0)
const at = (day: number, hour: number, minute = 0) => new Date(2026, 8, day, hour, minute)
const iso = (d: Date) => d.toISOString()

function block(overrides: Omit<Partial<PlanBlock>, 'start' | 'end'> & { start: Date }): PlanBlock {
  const minutes = overrides.minutes ?? 30
  const end = new Date(overrides.start.getTime() + minutes * 60 * 1000)
  return {
    taskId: overrides.taskId ?? `t-${overrides.start.getTime()}`,
    title: overrides.title ?? 'Chapitre 1',
    subjectId: overrides.subjectId === undefined ? 's-anat' : overrides.subjectId,
    subjectName: overrides.subjectName === undefined ? 'Anatomie' : overrides.subjectName,
    examDate: overrides.examDate ?? '2026-12-15',
    start: iso(overrides.start),
    end: iso(end),
    minutes,
    autoPlanned: overrides.autoPlanned ?? true,
  }
}

const formatDay = (d: Date) =>
  d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

console.log('\ndates et heures')
{
  check('demain = 1', localDayOffset(at(30, 9), now) === 1)
  check("aujourd'hui = 0", localDayOffset(at(29, 23, 30), now) === 0)
  check('hier = -1', localDayOffset(at(28, 9), now) === -1)
  // Passage a l'heure d'hiver en Europe le 25 octobre 2026 : une journee de 25 h.
  const beforeDst = new Date(2026, 9, 24, 23, 0)
  check('passage a l heure d hiver : lendemain = 1', localDayOffset(new Date(2026, 9, 25, 23, 30), beforeDst) === 1)
  check('9h00', formatHour(at(30, 9)) === '9h00')
  check('14h30', formatHour(at(30, 14, 30)) === '14h30')
}

console.log('\nblocs a venir')
{
  const past = block({ start: at(29, 18), title: 'Chapitre 9' })
  const running = block({ start: at(29, 20, 45), title: 'Chapitre 3' })
  const tomorrow = block({ start: at(30, 9), title: 'Chapitre 1' })
  const later = block({ start: new Date(2026, 9, 2, 14), title: 'Chapitre 2', subjectId: 's-bio', subjectName: 'Biologie cellulaire' })
  const broken = { ...block({ start: at(30, 10) }), start: 'pas une date' }
  const up = upcomingBlocks([later, past, tomorrow, running, broken], now)
  check('bloc passe et bloc invalide retires', up.length === 3, up.map((b) => b.title))
  check('tri du plus proche au plus lointain', eq(up.map((b) => b.title), ['Chapitre 3', 'Chapitre 1', 'Chapitre 2']))
  check('bloc deja commence exclu du verrouillage', nextBlockToLock([running, tomorrow, later], now)?.title === 'Chapitre 1')
  check('aucun bloc : null', nextBlockToLock([], now) === null)

  const farAway = block({ start: new Date(2026, 9, 20, 9) })
  const days = groupBlocksByDay([later, tomorrow, running, farAway], now, 14)
  check('jours regroupes et tries', eq(days.map((d) => d.offset), [0, 1, 3]), days.map((d) => d.offset))
  check('au-dela de 14 jours ignore', days.every((d) => d.offset < 14))
  check('jour local en YYYY-MM-DD', days[1].ymd === '2026-09-30', days[1].ymd)
  check('minuit local du jour', days[1].date.getHours() === 0 && days[1].date.getDate() === 30)

  const summary = summarizePlan([tomorrow, later, running, block({ start: at(30, 11), minutes: 45 })], now)
  check('nombre de seances a venir', summary.sessions === 4, summary)
  check('nombre de matieres', summary.subjects === 2, summary)
  check('duree la plus frequente', summary.typicalMinutes === 30, summary)
  check('chapitres reels detectes', summary.hasChapters === true)
  const generic = summarizePlan([block({ start: at(30, 9), title: 'Séance 1' }), block({ start: at(30, 10), title: 'Seance 2' })], now)
  check('seances generiques seules : pas de chapitre', generic.hasChapters === false, generic)
  check('planning vide : 30 min par defaut', summarizePlan([], now).typicalMinutes === 30)
}

console.log('\nlibelles')
{
  check('chapitre numerote', blockLabel({ title: 'Chapitre 1', subjectName: 'Anatomie' }) === 'Anatomie ch. 1')
  check('seance generique', blockLabel({ title: 'Séance 2', subjectName: 'Anatomie' }) === 'Anatomie, séance 2')
  check('titre colle', blockLabel({ title: 'Le squelette  axial', subjectName: 'Anatomie' }) === 'Anatomie : Le squelette axial')
  const long = blockLabel({ title: 'Introduction generale aux obligations civiles et commerciales du droit francais', subjectName: 'Droit civil' })
  check('titre long tronque', long.endsWith('…') && long.length <= 'Droit civil : '.length + 42, long)
  check('sans matiere : le titre', blockLabel({ title: 'Chapitre 4', subjectName: null }) === 'Chapitre 4')
}

console.log("\nphrase de l'ecran d'essai")
{
  const tomorrow = block({ start: at(30, 9), title: 'Chapitre 1' })
  check(
    'demain, mot pour mot',
    seen(trialHeadline(tomorrow, now, formatDay)) === 'Demain 9h00, Anatomie ch. 1 : tes applis se verrouillent toutes seules.',
    render(trialHeadline(tomorrow, now, formatDay))
  )
  const today = block({ start: at(29, 22, 15), title: 'Chapitre 2' })
  check("aujourd'hui", seen(trialHeadline(today, now, formatDay)).startsWith("Aujourd'hui 22h15, Anatomie ch. 2"))
  const later = block({ start: new Date(2026, 9, 2, 14), title: 'Chapitre 3' })
  const laterText = seen(trialHeadline(later, now, formatDay))
  check('plus tard : jour nomme avec majuscule', /^Vendredi 2 octobre 14h00, Anatomie ch\. 3/.test(laterText), laterText)
  check('sans bloc : phrase generale', seen(trialHeadline(null, now, formatDay)).includes('première séance'))
}

console.log('\ncours en gris')
{
  const wednesday = new Date(2026, 8, 30)
  const saturday = new Date(2026, 9, 3)
  const slots = [
    { start: iso(at(30, 8)), end: iso(at(30, 10)) },
    { start: iso(at(30, 13, 30)), end: iso(at(30, 16, 30)) },
    // Le soir n'est pas un cours.
    { start: iso(at(30, 20)), end: iso(at(30, 22)) },
  ]
  const range = busyLineForDay(wednesday, { slots, classesEndHour: null })
  check('agenda lu, sans reponse : plage du jour', !!range && seen(range) === 'Occupé de 8h00 à 16h30', range && render(range))
  // La reponse s'ajoute a l'agenda, comme cote serveur (weeklyBusyCoverage).
  const merged = busyLineForDay(wednesday, { slots, classesEndHour: 18 })
  check('agenda lu et reponse 18h : la plage couvre les deux', !!merged && seen(merged) === 'Occupé de 8h00 à 18h00', merged && render(merged))
  const thursday = new Date(2026, 9, 1)
  const emptyDay = busyLineForDay(thursday, { slots, classesEndHour: 18 })
  check('agenda lu mais vide ce jour : la reponse compte quand meme', !!emptyDay && seen(emptyDay) === "Cours jusqu'à 18h", emptyDay && render(emptyDay))
  check('agenda lu mais vide ce jour, sans reponse : rien', busyLineForDay(thursday, { slots, classesEndHour: null }) === null)
  const emptyAgenda = busyLineForDay(wednesday, { slots: [], classesEndHour: 18 })
  check('agenda de l iPhone lu a 0 creneau : la reponse compte', !!emptyAgenda && seen(emptyAgenda) === "Cours jusqu'à 18h", emptyAgenda && render(emptyAgenda))
  const fallback = busyLineForDay(wednesday, { slots: null, classesEndHour: 16 })
  check('question de secours en semaine', !!fallback && seen(fallback) === "Cours jusqu'à 16h", fallback && render(fallback))
  check('question de secours le samedi : rien', busyLineForDay(saturday, { slots: null, classesEndHour: 16 }) === null)
  check('rien du tout : rien', busyLineForDay(wednesday, { slots: null, classesEndHour: null }) === null)
}

console.log('\nreponses du questionnaire')
{
  check('concentration par la liste', readTraits({ dailyStruggles: ['focus'] }).focus === true)
  check('concentration par le curseur (2)', readTraits({ focusQuality: 2 }).focus === true)
  check('curseur a 3 jamais lu comme une reponse', readTraits({ focusQuality: 3, mentalLoad: 3, pressureLevel: 3 }).focus === false)
  check('charge par le curseur (4)', readTraits({ mentalLoad: 4 }).overwhelmed === true)
  check('retard par la situation', readTraits({ currentSituation: 'catchingup' }).behind === true)
  check('culpabilite par la question oui/non', readTraits({ shouldDoMore: true }).guilt === true)
  check('pression par le curseur (5)', readTraits({ pressureLevel: 5 }).pressure === true)
  check('valeurs inattendues ignorees', readTraits({ dailyStruggles: 'focus', focusQuality: '1' }).focus === false)

  const summary = summarizePlan([block({ start: at(30, 9) }), block({ start: at(30, 10), title: 'Chapitre 2' })], now)
  const neutral = planInsights({}, summary)
  check('aucune reponse : 2 phrases neutres', neutral.length === 2, neutral.map(render))
  neutral.forEach(seen)

  const real = planInsights({ dailyStruggles: ['focus', 'guilt'], mentalLoad: 5, pressureLevel: 5 }, summary)
  check('reponses reelles : 3 phrases au plus', real.length === 3, real.map(render))
  check('la 1re reprend la reponse de concentration', real[0].key === 'onbPlanInsightFocus' && render(real[0]).includes('30 min'))
  check('toutes commencent par « Tu »', real.every((c) => render(c).startsWith('Tu ')), real.map(render))
  real.forEach(seen)

  // Le rattrapage d'une seance ratee est reserve a Premium (autoPlan.ts) :
  // aucune phrase ne doit le promettre a un compte gratuit.
  const promisesCatchUp = (c: Copy) => /rates une séance/i.test(render(c)) && !render(c).includes('Premium')
  check('repli neutre : pas de promesse de rattrapage', !neutral.some(promisesCatchUp), neutral.map(render))
  const behindCopy = planInsights({ currentSituation: 'catchingup' }, summary)[0]
  check('retard : le rattrapage est nomme comme Premium', render(behindCopy).includes('Avec Premium'), render(behindCopy))

  const one = planInsights({ currentSituation: 'catchingup' }, summary)
  check('une seule reponse : elle ressort, completee par un repli', one.length === 2 && one[0].key === 'onbPlanInsightBehind', one.map((c) => c.key))
  check('pas deux fois le meme sujet', new Set(one.map((c) => c.key.replace('Neutral', ''))).size === one.length)
  one.forEach(seen)

  const noChapters = summarizePlan([block({ start: at(30, 9), title: 'Séance 1' }), block({ start: at(30, 10), title: 'Séance 2' })], now)
  const generic = planInsights({ goals: ['overwhelmed'] }, noChapters)
  check('seances generiques : on ne promet pas de chapitre', render(generic[0]).includes('sa matière'), generic.map(render))
  generic.forEach(seen)
  const genericNeutral = planInsights({}, noChapters)
  check('repli neutre sans chapitre', !render(genericNeutral[0]).includes('chapitre'), genericNeutral.map(render))
  genericNeutral.forEach(seen)

  const pressureSingle = planInsights({ pressureLevel: 5 }, summarizePlan([block({ start: at(30, 9) })], now))
  check('pression avec une seule seance : pas de phrase au pluriel faux', !pressureSingle.some((c) => c.key === 'onbPlanInsightPressure'))
  pressureSingle.forEach(seen)

  const trialScreenTime = trialInsights({ triedBefore: ['airplane_mode', 'screen_time'], dailyStruggles: ['focus'] }, summary)
  check('essai : le Temps d ecran passe en premier', trialScreenTime[0].key === 'onbTrialInsightScreenTime', trialScreenTime.map((c) => c.key))
  check('essai : 2 phrases au plus', trialScreenTime.length === 2)
  check('essai : « Ignorer la limite » cite', render(trialScreenTime[0]).includes('Ignorer la limite'))
  trialScreenTime.forEach(seen)
  const trialNothing = trialInsights({ triedBefore: ['nothing'] }, summary)
  check('essai : rien essaye', trialNothing.length === 1 && trialNothing[0].key === 'onbTrialInsightNothing')
  trialNothing.forEach(seen)
  const trialNeutral = trialInsights({}, summary)
  check('essai : repli neutre', trialNeutral.length === 1 && trialNeutral[0].key === 'onbTrialInsightNeutral')
  trialNeutral.forEach(seen)
  const trialGeneric = trialInsights({ mentalLoad: 5 }, noChapters)
  check('essai : sans chapitre, la matiere', render(trialGeneric[0]).includes('la matière est choisie'), trialGeneric.map(render))
  trialGeneric.forEach(seen)
}

console.log('\nvers le Mode Examen')
{
  const b = block({ start: at(30, 9), title: 'Chapitre 1', minutes: 30 })
  const params = examParamsForBlock(b)
  check('parametres de /exam/setup', eq(params, {
    taskId: b.taskId,
    title: 'Chapitre 1',
    subjectId: 's-anat',
    subjectName: 'Anatomie',
    minutes: '30',
    fromPlan: '1',
  }), params)
  check('sans bloc : aucun parametre', eq(examParamsForBlock(null), {}))
  check('matiere absente : chaine vide', examParamsForBlock(block({ start: at(30, 9), subjectId: null, subjectName: null })).subjectId === '')
}

console.log('\nsortie du paywall')
{
  const r = (reason: string, presented: boolean, result: 'purchased' | 'restored' | 'declined' | null, skippedReason: string | null = null) =>
    decideTrialExit({ kind: 'result', reason, presented, result, skippedReason })
  check('achat : apres achat', eq(r('presented', true, 'purchased'), { next: 'premium-setup', skipped: null }))
  check('restauration : apres achat', eq(r('presented', true, 'restored'), { next: 'premium-setup', skipped: null }))
  check('refus : seances offertes, sans verification', eq(r('presented', true, 'declined'), { next: 'free-sessions', skipped: null }))
  check('deja premium : apres achat', eq(r('premium_user', false, null), { next: 'premium-setup', skipped: null }))
  check(
    'placement absent : paywall_skipped et verification',
    eq(r('presented', false, null, 'PlacementNotFound'), { next: 'verify', skipped: 'PlacementNotFound' })
  )
  check('rien affiche sans raison : not_presented', eq(r('presented', false, null), { next: 'verify', skipped: 'not_presented' }))
  check('ferme sans resultat : verification, pas de skip', eq(r('presented', true, null), { next: 'verify', skipped: null }))
  check('delai d apparition : skip timeout', eq(r('timeout', false, null), { next: 'verify', skipped: 'timeout' }))
  check('erreur de presentation', eq(r('presentation_error', false, null), { next: 'verify', skipped: 'presentation_error' }))
  check('exception du SDK', eq(decideTrialExit({ kind: 'error' }), { next: 'verify', skipped: 'error' }))
}

console.log('\nreprise apres une app tuee')
{
  const flow = ['value-awareness', 'identity', 'tried-before', 'building-plan', 'planning', 'trial', 'free-sessions']
  check('pas d onboarding en cours : rien', resumeRouteFor(false, 'planning', flow) === null)
  check('reprise au dernier ecran', resumeRouteFor(true, 'planning', flow) === '/(onboarding-new)/planning')
  check('dernier ecran inconnu : debut du questionnaire', resumeRouteFor(true, null, flow) === '/(onboarding-new)/value-awareness')
  check('ecran retire du parcours : debut du questionnaire', resumeRouteFor(true, 'tasks-awareness', flow) === '/(onboarding-new)/value-awareness')
  check('liste vide : rien', resumeRouteFor(true, 'planning', []) === null)
}

console.log('\ndelai du calcul')
{
  check('delai atteint', isPlanTimeout(new Error('Erreur serveur'), 19_900, 20_000) === true)
  check('message de apiCall', isPlanTimeout(new Error('La requête a pris trop de temps. Vérifiez votre connexion internet.'), 5_000, 20_000) === true)
  check('panne rapide : pas un delai', isPlanTimeout(new Error('Erreur serveur (500)'), 800, 20_000) === false)
  check('rejet non Error', isPlanTimeout('timeout', 100, 20_000) === true)
}

console.log('\nseances offertes')
{
  check('2 seances', seen(freeSessionsTitle(2)) === 'Tes 2 séances bloquées offertes')
  check('1 seance', seen(freeSessionsTitle(1)) === 'Ta séance bloquée offerte')
  check('0 seance', seen(freeSessionsTitle(0)) === 'Tes séances offertes sont utilisées')
  check('serveur muet : aucune promesse', !seen(freeSessionsTitle(null)).includes('offerte'))
}

console.log('\nblocage automatique active')
{
  const tomorrow = block({ start: at(30, 9) })
  const far = block({ start: new Date(2026, 9, 2, 14) })
  check('plusieurs programmees', seen(autoBlockResultCopy('active', 3, tomorrow, now, formatDay)).includes('tes 3 prochaines séances'))
  check('une programmee', seen(autoBlockResultCopy('active', 1, tomorrow, now, formatDay)).includes('ta prochaine séance se verrouillera'))
  const laterText = seen(autoBlockResultCopy('active', 0, far, now, formatDay))
  check('rien dans les 24 h : on le dit', laterText.includes('24 heures') && laterText.includes('vendredi 2 octobre à 14h00'), laterText)
  check('rien du tout', seen(autoBlockResultCopy('active', 0, null, now, formatDay)).includes('dès qu'))
  check('webhook en retard', seen(autoBlockResultCopy('not_premium', 0, tomorrow, now, formatDay)).includes('pas encore reçu'))
  check('autorisation manquante', seen(autoBlockResultCopy('not_authorized', 0, tomorrow, now, formatDay)).includes("Temps d'écran"))
  check('aucune appli', seen(autoBlockResultCopy('no_selection', 0, tomorrow, now, formatDay)).includes('au moins une appli'))
  check('erreur', seen(autoBlockResultCopy('error', 0, tomorrow, now, formatDay)).includes('prochaine ouverture'))
  check('synchronisation absente', seen(autoBlockResultCopy(null, 0, tomorrow, now, formatDay)).includes('prochaine ouverture'))
}

console.log('\nregles de texte')
{
  const withTrial = allRendered.filter((text) => /essai/i.test(text))
  check(`aucun des ${allRendered.length} textes ne dit « essai »`, withTrial.length === 0, withTrial)
  const leftovers = allRendered.filter((text) => /\{[a-z]+\}/i.test(text))
  check('aucun parametre non remplace', leftovers.length === 0, leftovers)
  const longDash = allRendered.filter((text) => text.includes('—'))
  check('aucun tiret long', longDash.length === 0, longDash)
}

console.log(`\n${checks - failures}/${checks} verifications passees`)
if (failures > 0) process.exit(1)
