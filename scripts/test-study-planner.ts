/**
 * Test du StudyPlanner, sans base de donnees.
 *   npx tsx scripts/test-study-planner.ts
 *
 * Meme convention que scripts/test-catch-up-planner.ts : pas de runner, on
 * execute et on lit le resultat.
 */

import { formatInTimeZone } from 'date-fns-tz'
import {
  planStudy,
  localDateKey,
  daysBetweenKeys,
  type PlannerSubject,
  type PlannerTask,
} from '../lib/planning/StudyPlanner'

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

const MTL = 'America/Toronto'
const PARIS = 'Europe/Paris'

function chapters(subjectId: string, count: number, minutes = 45): PlannerTask[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${subjectId}-${String(i + 1).padStart(2, '0')}`,
    subjectId,
    estimatedMinutes: minutes,
    dueDate: null,
    order: 500,
    createdAt: new Date('2026-09-01T10:00:00Z'),
  }))
}

const hourIn = (d: Date, tz: string) => Number(formatInTimeZone(d, tz, 'H'))
const minuteOfDay = (d: Date, tz: string) =>
  Number(formatInTimeZone(d, tz, 'H')) * 60 + Number(formatInTimeZone(d, tz, 'm'))

// ---------------------------------------------------------------------------
console.log('\n1. Fuseau : un etudiant a Montreal est planifie a l\'heure de Montreal')
{
  // Jeudi 24 septembre 2026, 23h a Montreal = 03h UTC le 25.
  const now = new Date('2026-09-25T03:00:00Z')
  const subjects: PlannerSubject[] = [
    { id: 'droit', name: 'Droit', coefficient: 3, deadline: new Date('2026-10-20T12:00:00Z') },
  ]
  const plan = planStudy(subjects, chapters('droit', 6), [], { now, timeZone: MTL })
  check('6 chapitres places', plan.blocks.length === 6, plan.summary)
  const hours = plan.blocks.map((b) => hourIn(b.start, MTL))
  check('tous entre 9h et 22h heure de Montreal', hours.every((h) => h >= 9 && h < 22), hours)
  check('rien place avant demain matin (il est 23h)', localDateKey(plan.blocks[0].start, MTL) === '2026-09-25', plan.blocks[0])
  const utcHours = plan.blocks.map((b) => b.start.getUTCHours())
  check('et pas a 9h UTC (le defaut du moteur hebdomadaire)', !utcHours.every((h) => h >= 9 && h < 22) || utcHours.some((h) => h >= 13), utcHours)
}

// ---------------------------------------------------------------------------
console.log('\n2. Examen dans 5 jours : tout avant la veille, rien apres')
{
  const now = new Date('2026-09-24T06:00:00Z') // 8h a Paris
  const exam = new Date('2026-09-29T07:00:00Z') // mardi 29, 9h a Paris
  const subjects: PlannerSubject[] = [{ id: 'anat', name: 'Anatomie', coefficient: 5, deadline: exam }]
  const plan = planStudy(subjects, chapters('anat', 8, 60), [], { now, timeZone: PARIS })
  const examKey = localDateKey(exam, PARIS)
  const lastKey = plan.blocks.reduce((max, b) => {
    const k = localDateKey(b.start, PARIS)
    return k > max ? k : max
  }, '')
  check('les 8 chapitres sont places', plan.blocks.length === 8, plan.summary)
  check('aucun bloc le jour de l\'examen ni apres', lastKey < examKey, { lastKey, examKey })
  check('les 2 jours de revision generale restent libres', daysBetweenKeys(lastKey, examKey) >= 3, { lastKey, examKey })
}

// ---------------------------------------------------------------------------
console.log('\n3. Examen demain : place jusqu\'a ce soir, pas de place pour la revision generale')
{
  const now = new Date('2026-09-24T06:00:00Z')
  const exam = new Date('2026-09-25T07:00:00Z')
  const subjects: PlannerSubject[] = [{ id: 'eco', name: 'Eco', coefficient: 2, deadline: exam }]
  const plan = planStudy(subjects, chapters('eco', 3, 45), [], { now, timeZone: PARIS })
  check('3 chapitres places aujourd\'hui', plan.blocks.length === 3 && plan.blocks.every((b) => localDateKey(b.start, PARIS) === '2026-09-24'), plan.blocks)
}

// ---------------------------------------------------------------------------
console.log('\n4. Examen deja passe : rien n\'est place, et c\'est signale')
{
  const now = new Date('2026-09-24T06:00:00Z')
  const subjects: PlannerSubject[] = [{ id: 'old', name: 'Old', coefficient: 1, deadline: new Date('2026-09-20T07:00:00Z') }]
  const plan = planStudy(subjects, chapters('old', 2), [], { now, timeZone: PARIS })
  check('0 bloc', plan.blocks.length === 0)
  check('2 non places pour deadline_passed', plan.unplaced.filter((u) => u.reason === 'deadline_passed').length === 2, plan.unplaced)
}

// ---------------------------------------------------------------------------
console.log('\n5. Agenda occupe : aucun bloc ne chevauche un cours')
{
  const now = new Date('2026-09-24T22:00:00Z') // minuit a Paris
  const subjects: PlannerSubject[] = [
    { id: 'a', name: 'A', coefficient: 3, deadline: new Date('2026-10-15T07:00:00Z') },
    { id: 'b', name: 'B', coefficient: 1, deadline: new Date('2026-10-30T07:00:00Z') },
  ]
  // Vendredi 25 : cours de 8h a 18h a Paris.
  const busy = [{ start: new Date('2026-09-25T06:00:00Z'), end: new Date('2026-09-25T16:00:00Z') }]
  const plan = planStudy(subjects, [...chapters('a', 10), ...chapters('b', 10)], busy, { now, timeZone: PARIS })
  const overlap = plan.blocks.filter((b) => b.start < busy[0].end && b.end > busy[0].start)
  check('aucun chevauchement avec le cours', overlap.length === 0, overlap)
  const friday = plan.blocks.filter((b) => localDateKey(b.start, PARIS) === '2026-09-25')
  check('le vendredi ne garde que la soiree', friday.every((b) => hourIn(b.start, PARIS) >= 18), friday.map((b) => b.start))
  const overlapsBetweenBlocks = plan.blocks.some((b, i) => plan.blocks.slice(i + 1).some((c) => c.start < b.end && c.end > b.start))
  check('deux blocs ne se chevauchent jamais', !overlapsBetweenBlocks)
}

// ---------------------------------------------------------------------------
console.log('\n6. Capacite : jamais plus de 3 h par jour, et les matieres se melangent')
{
  const now = new Date('2026-09-24T22:00:00Z')
  const subjects: PlannerSubject[] = [
    { id: 'a', name: 'A', coefficient: 5, deadline: new Date('2026-11-20T07:00:00Z') },
    { id: 'b', name: 'B', coefficient: 3, deadline: new Date('2026-11-20T07:00:00Z') },
    { id: 'c', name: 'C', coefficient: 1, deadline: new Date('2026-11-20T07:00:00Z') },
  ]
  const plan = planStudy(subjects, [...chapters('a', 20), ...chapters('b', 20), ...chapters('c', 20)], [], { now, timeZone: PARIS })
  const byDay = new Map<string, number>()
  const subjectsByDay = new Map<string, Set<string>>()
  for (const b of plan.blocks) {
    const k = localDateKey(b.start, PARIS)
    byDay.set(k, (byDay.get(k) ?? 0) + b.minutes)
    subjectsByDay.set(k, (subjectsByDay.get(k) ?? new Set()).add(b.subjectId))
  }
  check('aucun jour au-dessus de 180 min', [...byDay.values()].every((m) => m <= 180), Object.fromEntries(byDay))
  // Tant qu'au moins deux matieres ont encore des chapitres a placer. Les
  // matieres a fort coefficient finissent leurs 20 chapitres avant la fin de
  // l'horizon, et la derniere reste alors seule : c'est normal. L'ancienne
  // version de ce test passait grace au faux regime critique (horizon tronque a
  // 14 jours), qui melangeait les derniers jours par accident.
  const lastDayOf = new Map<string, string>()
  for (const b of plan.blocks) {
    const k = localDateKey(b.start, PARIS)
    if ((lastDayOf.get(b.subjectId) ?? '') < k) lastDayOf.set(b.subjectId, k)
  }
  for (const u of plan.unplaced) lastDayOf.set(u.subjectId, '9999-12-31')
  const mixedWhilePossible = [...subjectsByDay.entries()].every(([k, s]) => {
    const stillOpen = [...lastDayOf.values()].filter((last) => last >= k).length
    return stillOpen < 2 || s.size >= 2
  })
  check('au moins 2 matieres par jour tant que 2 matieres ont des chapitres', mixedWhilePossible,
    Object.fromEntries([...subjectsByDay.entries()].map(([k, s]) => [k, [...s].join('')])))
  const minutesBySubject = (id: string) => plan.blocks.filter((b) => b.subjectId === id).reduce((s, b) => s + b.minutes, 0)
  check('la matiere coef 5 recoit plus que la coef 1', minutesBySubject('a') > minutesBySubject('c'), {
    a: minutesBySubject('a'),
    b: minutesBySubject('b'),
    c: minutesBySubject('c'),
  })
  check('le reste est signale no_capacity et non perdu', plan.blocks.length + plan.unplaced.length === 60, plan.summary)
}

// ---------------------------------------------------------------------------
console.log('\n7. Urgence : l\'examen le plus proche passe devant, meme a coefficient plus faible')
{
  const now = new Date('2026-09-24T22:00:00Z')
  const subjects: PlannerSubject[] = [
    { id: 'loin', name: 'Loin', coefficient: 4, deadline: new Date('2026-12-15T07:00:00Z') },
    { id: 'proche', name: 'Proche', coefficient: 2, deadline: new Date('2026-10-01T07:00:00Z') },
  ]
  const plan = planStudy(subjects, [...chapters('loin', 12), ...chapters('proche', 6)], [], { now, timeZone: PARIS })
  const proche = plan.blocks.filter((b) => b.subjectId === 'proche')
  check('les 6 chapitres de l\'examen proche sont tous places', proche.length === 6, plan.unplaced)
  check('et avant son examen', proche.every((b) => b.start < new Date('2026-10-01T07:00:00Z')))
}

// ---------------------------------------------------------------------------
console.log('\n8. Rien dans les 30 minutes qui viennent, heures arrondies a 5 min')
{
  const now = new Date('2026-09-24T12:07:00Z') // 14h07 a Paris
  const subjects: PlannerSubject[] = [{ id: 'a', name: 'A', coefficient: 1, deadline: null }]
  const plan = planStudy(subjects, chapters('a', 2), [], { now, timeZone: PARIS })
  check('premier bloc apres 14h37', plan.blocks[0].start.getTime() >= now.getTime() + 30 * 60 * 1000, plan.blocks[0])
  check('minutes multiples de 5', plan.blocks.every((b) => minuteOfDay(b.start, PARIS) % 5 === 0))
}

// ---------------------------------------------------------------------------
console.log('\n9. Changement d\'heure : les blocs restent a l\'heure locale')
{
  // Passage a l'heure d'hiver en France le dimanche 25 octobre 2026.
  const now = new Date('2026-10-23T22:00:00Z')
  const subjects: PlannerSubject[] = [{ id: 'a', name: 'A', coefficient: 1, deadline: null }]
  const plan = planStudy(subjects, chapters('a', 12), [], { now, timeZone: PARIS })
  check('tous entre 9h et 22h heure de Paris, avant et apres le changement', plan.blocks.every((b) => {
    const h = hourIn(b.start, PARIS)
    return h >= 9 && h < 22
  }), plan.blocks.map((b) => formatInTimeZone(b.start, PARIS, 'EEE HH:mm')))
}

// ---------------------------------------------------------------------------
console.log('\n10. Echeance personnelle deja passee : le chapitre est place au plus tot, pas abandonne')
{
  const now = new Date('2026-09-24T22:00:00Z')
  const subjects: PlannerSubject[] = [{ id: 'a', name: 'A', coefficient: 2, deadline: null }]
  const late: PlannerTask[] = chapters('a', 2).map((t) => ({ ...t, dueDate: new Date('2026-04-08T10:00:00Z') }))
  const plan = planStudy(subjects, late, [], { now, timeZone: PARIS })
  check('les 2 chapitres en retard sont places', plan.blocks.length === 2, plan.unplaced)
  check('des le premier jour', plan.blocks.every((b) => localDateKey(b.start, PARIS) === '2026-09-25'))
}

// ---------------------------------------------------------------------------
// 11 a 15 : le regime critique. Avant le correctif du 26 septembre, il comptait
// les jours restants jusqu'au dernier jour de l'horizon (13) mais TOUS les
// chapitres de la matiere : au-dela de 63 chapitres de 30 min (14 x 180 x 0,75
// = 1 890 min), une matiere passait critique quelle que soit sa date d'examen et
// prenait toute la capacite de chaque jour.

const minutesOn = (plan: ReturnType<typeof planStudy>, subjectId: string, fromKey: string, toKey: string, tz: string) =>
  plan.blocks
    .filter((b) => b.subjectId === subjectId && localDateKey(b.start, tz) >= fromKey && localDateKey(b.start, tz) <= toKey)
    .reduce((s, b) => s + b.minutes, 0)

console.log('\n11. Grosse UE de PASS, examen en decembre : elle ne mange plus les autres UE')
{
  const now = new Date('2026-09-24T22:00:00Z') // vendredi 25, minuit a Paris
  const exam = new Date('2026-12-15T08:00:00Z')
  const subjects: PlannerSubject[] = [
    { id: 'ue1', name: 'UE1 Chimie', coefficient: 5, deadline: exam },
    { id: 'ue2', name: 'UE2', coefficient: 2, deadline: exam },
    { id: 'ue3', name: 'UE3', coefficient: 2, deadline: exam },
    { id: 'ue4', name: 'UE4', coefficient: 2, deadline: exam },
  ]
  const tasks = [...chapters('ue1', 80, 30), ...chapters('ue2', 10, 30), ...chapters('ue3', 10, 30), ...chapters('ue4', 10, 30)]
  const plan = planStudy(subjects, tasks, [], { now, timeZone: PARIS })
  const day0 = plan.blocks.filter((b) => localDateKey(b.start, PARIS) === '2026-09-25')
  check('le premier jour n\'est pas entierement pris par la grosse UE', day0.some((b) => b.subjectId !== 'ue1'), day0.map((b) => b.subjectId))
  const firstWeek = ['ue1', 'ue2', 'ue3', 'ue4'].map((id) => minutesOn(plan, id, '2026-09-25', '2026-10-01', PARIS))
  const weekTotal = firstWeek.reduce((s, m) => s + m, 0)
  check('la grosse UE a moins de 60 % de la premiere semaine', firstWeek[0] < weekTotal * 0.6, firstWeek)
  check('chaque petite UE a du temps la premiere semaine', firstWeek.slice(1).every((m) => m > 0), firstWeek)
  check('et la grosse UE recoit plus que chacune des petites', firstWeek.slice(1).every((m) => firstWeek[0] > m), firstWeek)
}

console.log('\n12. 80 chapitres sans date d\'examen : pas critique, la petite matiere passe aussi')
{
  const now = new Date('2026-09-24T22:00:00Z')
  const subjects: PlannerSubject[] = [
    { id: 'gros', name: 'Gros', coefficient: 2, deadline: null },
    { id: 'petit', name: 'Petit', coefficient: 2, deadline: null },
  ]
  const plan = planStudy(subjects, [...chapters('gros', 80, 30), ...chapters('petit', 5, 30)], [], { now, timeZone: PARIS })
  const petit = plan.blocks.filter((b) => b.subjectId === 'petit')
  check('la petite matiere a un bloc des le premier jour', petit.some((b) => localDateKey(b.start, PARIS) === '2026-09-25'), petit.map((b) => b.start))
  check('et ses 5 chapitres dans les 3 premiers jours', petit.length === 5 && petit.every((b) => localDateKey(b.start, PARIS) <= '2026-09-27'), petit.map((b) => b.start))
}

console.log('\n13. Critique pour de vrai : l\'examen dans 5 jours passe devant et finit a temps')
{
  const now = new Date('2026-09-24T06:00:00Z') // jeudi 24, 8h a Paris
  const soon = new Date('2026-09-29T07:00:00Z') // mardi 29 : chapitres jusqu'au samedi 26
  const subjects: PlannerSubject[] = [
    { id: 'urgent', name: 'Urgent', coefficient: 2, deadline: soon },
    { id: 'loin', name: 'Loin', coefficient: 5, deadline: new Date('2026-12-15T08:00:00Z') },
  ]
  // 12 x 45 min = 540 min, soit exactement 3 jours de capacite.
  const plan = planStudy(subjects, [...chapters('urgent', 12, 45), ...chapters('loin', 20, 45)], [], { now, timeZone: PARIS })
  const urgent = plan.blocks.filter((b) => b.subjectId === 'urgent')
  check('les 12 chapitres urgents sont tous places', urgent.length === 12, plan.unplaced.filter((u) => u.subjectId === 'urgent'))
  check('avant les 2 jours de revision generale', urgent.every((b) => localDateKey(b.start, PARIS) <= '2026-09-26'), urgent.map((b) => b.start))
  check('la matiere lointaine reprend ensuite', plan.blocks.some((b) => b.subjectId === 'loin'), plan.summary)
}

console.log('\n14. Deux UE critiques au meme concours : elles s\'alternent, aucune n\'attend')
{
  const now = new Date('2026-09-24T06:00:00Z')
  const exam = new Date('2026-09-30T07:00:00Z') // chapitres jusqu'au dimanche 27
  const subjects: PlannerSubject[] = [
    { id: 's1', name: 'S1', coefficient: 3, deadline: exam },
    { id: 's2', name: 'S2', coefficient: 3, deadline: exam },
  ]
  // 2 x 900 min pour 720 min de capacite : impossible de tout faire.
  const plan = planStudy(subjects, [...chapters('s1', 20, 45), ...chapters('s2', 20, 45)], [], { now, timeZone: PARIS })
  const day0 = new Set(plan.blocks.filter((b) => localDateKey(b.start, PARIS) === '2026-09-24').map((b) => b.subjectId))
  check('les deux UE travaillees des le premier jour', day0.has('s1') && day0.has('s2'), [...day0])
  const m1 = minutesOn(plan, 's1', '2026-09-24', '2026-09-27', PARIS)
  const m2 = minutesOn(plan, 's2', '2026-09-24', '2026-09-27', PARIS)
  check('et a peu pres autant de temps chacune', Math.abs(m1 - m2) <= 45, { m1, m2 })
}

console.log('\n15. Chapitres dus demain dans une matiere a examen lointain : servis avant demain soir')
{
  const now = new Date('2026-09-24T06:00:00Z')
  const tomorrow = new Date('2026-09-25T16:00:00Z')
  const subjects: PlannerSubject[] = [
    { id: 'td', name: 'TD', coefficient: 1, deadline: new Date('2026-12-15T08:00:00Z') },
    { id: 'autre', name: 'Autre', coefficient: 5, deadline: new Date('2026-12-15T08:00:00Z') },
  ]
  // Les 6 chapitres dus demain sont en fin de file (ordre de creation) : le
  // regime critique doit aller les chercher, pas servir les 4 premiers.
  const td = chapters('td', 10, 45).map((t, i) => (i >= 4 ? { ...t, dueDate: tomorrow } : t))
  const plan = planStudy(subjects, [...td, ...chapters('autre', 20, 45)], [], { now, timeZone: PARIS })
  const due = plan.blocks.filter((b) => b.subjectId === 'td' && Number(b.taskId.slice(-2)) >= 5)
  check('les 6 chapitres dus demain sont places', due.length === 6, plan.unplaced.filter((u) => u.subjectId === 'td'))
  check('au plus tard demain', due.every((b) => localDateKey(b.start, PARIS) <= '2026-09-25'), due.map((b) => b.start))
}

console.log(`\n${checks - failures}/${checks} verifications passees`)
if (failures > 0) process.exit(1)
