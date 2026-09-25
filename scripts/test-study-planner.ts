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
  check('au moins 2 matieres par jour', [...subjectsByDay.values()].every((s) => s.size >= 2))
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

console.log(`\n${checks - failures}/${checks} verifications passees`)
if (failures > 0) process.exit(1)
