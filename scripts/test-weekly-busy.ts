/**
 * Test de lib/planning/weeklyBusy.ts (emploi du temps de secours), sans base.
 *   npx tsx scripts/test-weekly-busy.ts
 *
 * Meme convention que scripts/test-study-planner.ts : pas de runner, on execute
 * et on lit le resultat.
 */

import { formatInTimeZone } from 'date-fns-tz'
import { planStudy, localDateKey, type PlannerSubject, type PlannerTask } from '../lib/planning/StudyPlanner'
import {
  parseWeeklyBusy,
  makeWeeklyBusy,
  isoWeekday,
  weeklyBusyIntervals,
  weeklyBusyCoverage,
} from '../lib/planning/weeklyBusy'

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

const PARIS = 'Europe/Paris'
const MTL = 'America/Toronto'
const DAY = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
console.log('\n1. Lecture de User.weeklyBusy')
{
  check('valeur complete', JSON.stringify(parseWeeklyBusy({ classesEndHour: 16, days: [1, 2, 3, 4, 5] })) === JSON.stringify({ classesEndHour: 16, days: [1, 2, 3, 4, 5] }))
  check('jours absents = lundi a vendredi', JSON.stringify(parseWeeklyBusy({ classesEndHour: 14 })?.days) === '[1,2,3,4,5]')
  check('jours vides = lundi a vendredi', JSON.stringify(parseWeeklyBusy({ classesEndHour: 14, days: [] })?.days) === '[1,2,3,4,5]')
  check('jours nettoyes, dedoublonnes, tries', JSON.stringify(parseWeeklyBusy({ classesEndHour: 12, days: [5, 3, 3, 9, 0, 'x', 1.5, 1] })?.days) === '[1,3,5]')
  check('heure absente : null', parseWeeklyBusy({ days: [1] }) === null)
  check('heure non entiere : null', parseWeeklyBusy({ classesEndHour: 16.5 }) === null)
  check('heure absurde (8h, 23h) : null', parseWeeklyBusy({ classesEndHour: 8 }) === null && parseWeeklyBusy({ classesEndHour: 23 }) === null)
  check('valeur corrompue (chaine, tableau, null) : null', [ '16', [16], null, undefined ].every((v) => parseWeeklyBusy(v) === null))
  check('makeWeeklyBusy(null) = null (pas de reponse)', makeWeeklyBusy(null) === null)
  check('makeWeeklyBusy(18) = semaine de 8h a 18h', JSON.stringify(makeWeeklyBusy(18)) === JSON.stringify({ classesEndHour: 18, days: [1, 2, 3, 4, 5] }))
}

// ---------------------------------------------------------------------------
console.log('\n2. Jours de la semaine')
{
  check('lundi 28 septembre 2026 = 1', isoWeekday('2026-09-28') === 1)
  check('dimanche 27 septembre 2026 = 7', isoWeekday('2026-09-27') === 7)
  check('vendredi 25 septembre 2026 = 5', isoWeekday('2026-09-25') === 5)
}

// ---------------------------------------------------------------------------
console.log('\n3. Creneaux : 8h a la fin des cours, heure locale, jours de cours seulement')
{
  const weekly = makeWeeklyBusy(16)!
  // Du vendredi 25 au jeudi 1er : 5 jours de cours, samedi et dimanche libres.
  const slots = weeklyBusyIntervals(weekly, '2026-09-25', 7, PARIS)
  check('5 creneaux sur 7 jours', slots.length === 5, slots.length)
  check('aucun le week-end', slots.every((s) => ![6, 7].includes(isoWeekday(localDateKey(s.start, PARIS)))))
  check('de 8h a 16h heure de Paris', slots.every((s) => formatInTimeZone(s.start, PARIS, 'HH:mm') === '08:00' && formatInTimeZone(s.end, PARIS, 'HH:mm') === '16:00'),
    slots.map((s) => formatInTimeZone(s.start, PARIS, 'EEE HH:mm') + '-' + formatInTimeZone(s.end, PARIS, 'HH:mm')))
  check('en heure d\'ete : 06:00 a 14:00 UTC', slots[0].start.toISOString() === '2026-09-25T06:00:00.000Z' && slots[0].end.toISOString() === '2026-09-25T14:00:00.000Z', slots[0])

  // Passage a l'heure d'hiver le dimanche 25 octobre : le lundi 26 reste 8h-16h local.
  const winter = weeklyBusyIntervals(weekly, '2026-10-26', 1, PARIS)
  check('apres le changement d\'heure : 07:00 a 15:00 UTC', winter[0]?.start.toISOString() === '2026-10-26T07:00:00.000Z' && winter[0]?.end.toISOString() === '2026-10-26T15:00:00.000Z', winter)

  const mtl = weeklyBusyIntervals(makeWeeklyBusy(12)!, '2026-09-28', 1, MTL)
  check('a Montreal, 8h-12h = 12:00 a 16:00 UTC', mtl[0]?.start.toISOString() === '2026-09-28T12:00:00.000Z' && mtl[0]?.end.toISOString() === '2026-09-28T16:00:00.000Z', mtl)
}

// ---------------------------------------------------------------------------
console.log('\n4. Rognage : rien avant la fin d\'un instantane Apple')
{
  const weekly = makeWeeklyBusy(16)!
  const noon = new Date('2026-09-25T10:00:00Z') // vendredi 12h a Paris
  const slots = weeklyBusyIntervals(weekly, '2026-09-25', 4, PARIS, noon)
  check('le vendredi commence a la fin de l\'instantane', slots[0].start.getTime() === noon.getTime() && slots[0].end.toISOString() === '2026-09-25T14:00:00.000Z', slots[0])
  const late = weeklyBusyIntervals(weekly, '2026-09-25', 1, PARIS, new Date('2026-09-25T15:00:00Z'))
  check('un jour deja decrit en entier ne produit rien', late.length === 0, late)
}

// ---------------------------------------------------------------------------
console.log('\n5. Ce que l\'emploi du temps de secours couvre')
{
  const now = new Date('2026-09-25T02:00:00Z')
  const maxAge = 3 * DAY
  const fresh = { updatedAt: new Date(now.getTime() - DAY), rangeEnd: new Date(now.getTime() + 13 * DAY) }
  const stale = { updatedAt: new Date(now.getTime() - 4 * DAY), rangeEnd: new Date(now.getTime() + 10 * DAY) }

  const none = weeklyBusyCoverage({ googleRead: false, snapshot: null, now, snapshotMaxAgeMs: maxAge })
  check('aucun agenda : tout l\'horizon', none.use && none.from === null && none.reason === 'no_calendar', none)

  // Relecture du 26 septembre : un agenda lu ne contient pas forcement les
  // cours (ENT absent de l'iPhone, cours hors de l'agenda principal Google).
  const google = weeklyBusyCoverage({ googleRead: true, snapshot: null, now, snapshotMaxAgeMs: maxAge })
  check('Google lu sans cours : la reponse couvre quand meme tout l\'horizon', google.use && google.from === null, google)

  const expired = weeklyBusyCoverage({ googleRead: true, snapshot: stale, now, snapshotMaxAgeMs: maxAge })
  check('instantane Apple perime : tout l\'horizon, meme avec Google lu', expired.use && expired.from === null && expired.reason === 'apple_expired', expired)

  const expiredNoGoogle = weeklyBusyCoverage({ googleRead: false, snapshot: stale, now, snapshotMaxAgeMs: maxAge })
  check('instantane Apple perime, pas de Google : tout l\'horizon', expiredNoGoogle.use && expiredNoGoogle.from === null, expiredNoGoogle)

  const recent = weeklyBusyCoverage({ googleRead: false, snapshot: fresh, now, snapshotMaxAgeMs: maxAge })
  check('instantane Apple frais (0 creneau ou pas) : tout l\'horizon, pas seulement apres sa fin', recent.use && recent.from === null, recent)

  const recentGoogle = weeklyBusyCoverage({ googleRead: true, snapshot: fresh, now, snapshotMaxAgeMs: maxAge })
  check('instantane Apple frais et Google lu : tout l\'horizon', recentGoogle.use && recentGoogle.from === null, recentGoogle)

  // Le calcul rapide de l'onboarding (sans Google) et le calcul complet (avec
  // Google) doivent appliquer la meme reponse, sinon l'heure montree sur
  // l'ecran d'essai change quelques secondes plus tard.
  const fast = weeklyBusyCoverage({ googleRead: false, snapshot: null, now, snapshotMaxAgeMs: maxAge })
  const full = weeklyBusyCoverage({ googleRead: true, snapshot: null, now, snapshotMaxAgeMs: maxAge })
  check('calcul rapide et calcul avec Google : meme couverture', fast.use === full.use && fast.use && full.use && fast.from === full.from)

  // Instantane Apple frais a 0 creneau : les creneaux de secours sont bien
  // produits sur toute la semaine, pas seulement apres rangeEnd.
  const emptyApple = weeklyBusyCoverage({ googleRead: false, snapshot: fresh, now, snapshotMaxAgeMs: maxAge })
  const emptyAppleSlots = emptyApple.use ? weeklyBusyIntervals(makeWeeklyBusy(18)!, '2026-09-28', 5, PARIS, emptyApple.from) : []
  check('instantane Apple vide + 18h : 5 creneaux de 8h a 18h du lundi au vendredi', emptyAppleSlots.length === 5, emptyAppleSlots)
}

// ---------------------------------------------------------------------------
console.log('\n6. Avec le planificateur : aucune seance pendant les cours, le week-end reste libre')
{
  const now = new Date('2026-09-24T22:00:00Z') // vendredi 25, minuit a Paris
  const subjects: PlannerSubject[] = [
    { id: 'a', name: 'A', coefficient: 3, deadline: new Date('2026-12-15T08:00:00Z') },
    { id: 'b', name: 'B', coefficient: 2, deadline: new Date('2026-12-15T08:00:00Z') },
  ]
  const tasks: PlannerTask[] = ['a', 'b'].flatMap((subjectId) =>
    Array.from({ length: 30 }, (_, i) => ({
      id: `${subjectId}-${i}`,
      subjectId,
      estimatedMinutes: 30,
      dueDate: null,
      order: 500,
      createdAt: new Date('2026-09-01T10:00:00Z'),
    }))
  )
  const busy = weeklyBusyIntervals(makeWeeklyBusy(16)!, localDateKey(now, PARIS), 15, PARIS)
  const plan = planStudy(subjects, tasks, busy, { now, timeZone: PARIS })
  const weekdayBefore16 = plan.blocks.filter((b) => {
    const iso = isoWeekday(localDateKey(b.start, PARIS))
    return iso <= 5 && Number(formatInTimeZone(b.start, PARIS, 'H')) < 16
  })
  check('aucun bloc en semaine avant 16h', weekdayBefore16.length === 0, weekdayBefore16.map((b) => formatInTimeZone(b.start, PARIS, 'EEE HH:mm')))
  const weekend = plan.blocks.filter((b) => isoWeekday(localDateKey(b.start, PARIS)) >= 6)
  check('le week-end commence le matin', weekend.some((b) => Number(formatInTimeZone(b.start, PARIS, 'H')) < 12), weekend.map((b) => formatInTimeZone(b.start, PARIS, 'EEE HH:mm')))
  check('et des blocs sont quand meme places en semaine, le soir', plan.blocks.some((b) => isoWeekday(localDateKey(b.start, PARIS)) <= 5))
}

console.log(`\n${checks - failures}/${checks} verifications passees`)
if (failures > 0) process.exit(1)
