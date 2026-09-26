/**
 * Test de la logique pure de l'onboarding 1.5, sans simulateur.
 *   ./node_modules/.bin/tsx mobile-app-new/scripts/test-onboarding-logic.ts   (depuis la racine du depot)
 *
 * Meme convention que scripts/test-study-planner.ts a la racine : pas de
 * runner, on execute et on lit le resultat. Les dates sont construites en
 * heure LOCALE (new Date(a, m, j, h)), comme sur le telephone.
 */

import {
  buildPlanRequest,
  clampChapterCount,
  defaultExamDate,
  inferClassesEndHour,
  isFirstSemesterSeason,
  minimumExamDate,
  parseChapterList,
  parseLocalYmd,
  pickAnswers,
  sanitizeExamDate,
  subjectKey,
  toLocalYmd,
  trackFromStudentType,
  MAX_CHAPTERS_PER_SUBJECT,
  MAX_SUBJECTS,
  type DraftSubject,
} from '../lib/onboardingLogic'

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

console.log('\nparseChapterList')
{
  const pasted = [
    '1. Introduction au droit des contrats',
    '2) La formation du contrat',
    '  - La responsabilite civile  ',
    '• Les quasi-contrats',
    '',
    '12',
    'Chapitre 5 : Les suretes',
    '1.2 Les vices du consentement',
    'IV. Le droit des biens',
    'a) Les obligations',
    'Civil: les regimes matrimoniaux',
    '3-D et droit',
  ].join('\n')
  const titles = parseChapterList(pasted)
  check('retire puces et numeros nus, garde les titres', eq(titles, [
    'Introduction au droit des contrats',
    'La formation du contrat',
    'La responsabilite civile',
    'Les quasi-contrats',
    'Chapitre 5 : Les suretes',
    '1.2 Les vices du consentement',
    'Le droit des biens',
    'Les obligations',
    'Civil: les regimes matrimoniaux',
    '3-D et droit',
  ]), titles)
  check('point-virgule separe aussi', eq(parseChapterList('Ch A ; Ch B;Ch C'), ['Ch A', 'Ch B', 'Ch C']))
  check('tirets et points de liste', eq(parseChapterList('\u2014 A\n\u2013 B\n\u00b7 C'), ['A', 'B', 'C']))
  check('CRLF de Windows', eq(parseChapterList('A\r\nB\r\n'), ['A', 'B']))
  check('texte vide', eq(parseChapterList('  \n \n'), []))
  const many = Array.from({ length: 200 }, (_, i) => `Chapitre ${i + 1}`).join('\n')
  check(`plafond a ${MAX_CHAPTERS_PER_SUBJECT}`, parseChapterList(many).length === MAX_CHAPTERS_PER_SUBJECT)
  check('titre tronque a 200', parseChapterList('x'.repeat(500))[0].length === 200)
}

console.log('\nclampChapterCount')
check('0 devient 1', clampChapterCount(0) === 1)
check('200 devient 80', clampChapterCount(200) === 80)
check('NaN devient la valeur par defaut', clampChapterCount(Number.NaN) === 10)

console.log('\nDates')
{
  const now = new Date(2026, 8, 25, 23, 30) // 25 septembre 2026, 23h30 locale
  check('minimum = demain', toLocalYmd(minimumExamDate(now)) === '2026-09-26')
  check('saison S1 en septembre', isFirstSemesterSeason(now))
  check('defaut 15 decembre en septembre', toLocalYmd(defaultExamDate(now)) === '2026-12-15')
  const dec10 = new Date(2026, 11, 10)
  check('defaut +45 j le 10 decembre (15 decembre trop proche)', toLocalYmd(defaultExamDate(dec10)) === '2027-01-24')
  const march = new Date(2027, 2, 1)
  check('hors saison en mars', !isFirstSemesterSeason(march))
  check('parseLocalYmd refuse le 31 fevrier', parseLocalYmd('2027-02-31') === null)
  check('parseLocalYmd refuse un format libre', parseLocalYmd('15/12/2026') === null)
  check('sanitize garde une date future', sanitizeExamDate('2026-12-15', now) === '2026-12-15')
  check('sanitize garde aujourd hui', sanitizeExamDate('2026-09-25', now) === '2026-09-25')
  check('sanitize met null une date passee', sanitizeExamDate('2026-09-24', now) === null)
  check('sanitize met null une chaine invalide', sanitizeExamDate('demain', now) === null)
}

console.log('\ninferClassesEndHour')
{
  // Semaine du lundi 28 septembre 2026.
  const at = (day: number, h: number, m = 0) => new Date(2026, 8, day, h, m)
  const week = [
    { start: at(28, 8), end: at(28, 12) },
    { start: at(28, 14), end: at(28, 17, 30) },
    { start: at(29, 9), end: at(29, 16) },
    { start: at(30, 10), end: at(30, 12) },
    { start: at(1 + 30, 8), end: at(1 + 30, 14) }, // jeudi 1er octobre (debordement de mois volontaire)
    { start: at(2 + 30, 8), end: at(2 + 30, 16, 10) },
  ]
  // fins par jour : 17.5, 16 (bloc de 7 h, compte), 12, 14, 16.17 -> mediane 16 -> 16h
  check('mediane arrondie vers le haut avec 15 min de tolerance', inferClassesEndHour(week) === 16, inferClassesEndHour(week))
  check('un seul jour ne suffit pas', inferClassesEndHour([{ start: at(28, 8), end: at(28, 12) }]) === null)
  const weekend = [
    { start: new Date(2026, 8, 26, 9), end: new Date(2026, 8, 26, 17) },
    { start: new Date(2026, 8, 27, 9), end: new Date(2026, 8, 27, 17) },
  ]
  check('le week-end est ignore', inferClassesEndHour(weekend) === null)
  const evenings = [
    { start: at(28, 20), end: at(28, 22) },
    { start: at(29, 19, 30), end: at(29, 21) },
  ]
  check('les soirees ne sont pas des cours', inferClassesEndHour(evenings) === null)
  const lateThirteen = [
    { start: at(28, 8), end: at(28, 13) },
    { start: at(29, 8), end: at(29, 13) },
  ]
  check('finir a 13h donne 14h', inferClassesEndHour(lateThirteen) === 14)
  const late = [
    { start: at(28, 14), end: at(28, 19, 45) },
    { start: at(29, 14), end: at(29, 19) },
  ]
  check('au-dela de 16h15 donne 18h', inferClassesEndHour(late) === 18)
  check('accepte des chaines ISO', inferClassesEndHour(week.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() }))) === 16)
  const multiDay = [
    { start: at(28, 8), end: at(30, 18) }, // 58 h, evenement de plusieurs jours : ignore
    { start: at(29, 8), end: at(29, 12) },
  ]
  check('un creneau de plus de 12 h est ignore', inferClassesEndHour(multiDay) === null)
  const tpDays = [
    { start: at(28, 8), end: at(28, 17) }, // journee de TP de 9 h : compte
    { start: at(29, 8), end: at(29, 17) },
  ]
  check('une journee de TP de 9 h compte', inferClassesEndHour(tpDays) === 18)
}

console.log('\ntrackFromStudentType')
check('lycee sans ambiguite', trackFromStudentType('highschool') === 'lycee')
check('medecine/droit/prepa ne devine rien', trackFromStudentType('medlawprepa') === null)

console.log('\nsubjectKey')
check('insensible aux accents et a la casse', subjectKey('  Économie ') === subjectKey('economie'))

console.log('\npickAnswers')
{
  const answers = pickAnswers(
    { firstName: 'Lea', studentType: 'university', goals: ['exams'], focusQuality: 2, rawTasks: 'x', currentStep: 8, timeHorizon: '' },
    { triedBefore: ['screen_time'], track: 'droit', calendarChoice: 'apple' }
  )
  check('garde les reponses, jamais le prenom ni les metadonnees', eq(answers, {
    studentType: 'university',
    goals: ['exams'],
    focusQuality: 2,
    triedBefore: ['screen_time'],
    track: 'droit',
    calendarChoice: 'apple',
  }), answers)
  check('reponses absentes', eq(pickAnswers(undefined), {}))
}

console.log('\nbuildPlanRequest')
{
  const now = new Date(2026, 8, 25, 12)
  const s = (name: string, big: boolean, chapters: DraftSubject['chapters']): DraftSubject => ({ id: name, name, big, chapters })
  const request = buildPlanRequest(
    {
      idempotencyKey: 'k-1',
      examDate: '2026-12-15',
      examDateUnknown: false,
      subjects: [
        s('Anatomie', true, { mode: 'list', titles: ['Os', '  ', 'Muscles'] }),
        s('SHS', false, { mode: 'count', count: 500 }),
        s('Biochimie', false, { mode: 'later' }),
        s('Chimie', false, null),
        s('anatomie ', false, null), // doublon
        s('   ', false, null), // vide
        s('Liste vide', true, { mode: 'list', titles: [] }),
      ],
      classesEndHour: 16,
    },
    { focusQuality: 2 },
    now
  )
  check('forme du contrat', eq(request, {
    idempotencyKey: 'k-1',
    examDate: '2026-12-15',
    subjects: [
      { name: 'Anatomie', big: true, chapters: { titles: ['Os', 'Muscles'] } },
      { name: 'SHS', big: false, chapters: { count: 80 } },
      { name: 'Biochimie', big: false },
      { name: 'Chimie', big: false },
      { name: 'Liste vide', big: true },
    ],
    classesEndHour: 16,
    answers: { focusQuality: 2 },
  }), request)

  const unknown = buildPlanRequest(
    { idempotencyKey: 'k', examDate: '2026-12-15', examDateUnknown: true, subjects: [], classesEndHour: null },
    {},
    now
  )
  check('« je ne sais pas » envoie examDate null', unknown.examDate === null)
  const past = buildPlanRequest(
    { idempotencyKey: 'k', examDate: '2026-09-01', examDateUnknown: false, subjects: [], classesEndHour: 13 as any },
    {},
    now
  )
  check('date passee envoyee en null', past.examDate === null)
  check('heure hors liste envoyee en null', past.classesEndHour === null)
  const tooMany = buildPlanRequest(
    {
      idempotencyKey: 'k',
      examDate: null,
      examDateUnknown: false,
      subjects: Array.from({ length: 20 }, (_, i) => s(`M${i}`, false, null)),
      classesEndHour: null,
    },
    {},
    now
  )
  check(`plafond a ${MAX_SUBJECTS} matieres`, tooMany.subjects.length === MAX_SUBJECTS)
}

console.log(`\n${checks - failures}/${checks} verifications passees`)
if (failures > 0) process.exit(1)
