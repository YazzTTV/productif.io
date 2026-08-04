/**
 * Test du CatchUpPlanner, sans base de donnees.
 *   npx tsx scripts/test-catch-up-planner.ts
 *
 * Suit la convention des autres scripts/test-*.js du projet : pas de runner,
 * on execute et on lit le resultat.
 */

import {
  planCatchUp,
  localDayIndex,
  localTimeOfDayMs,
  fromLocalDayIndex,
  type CatchUpTask,
} from '../lib/planning/CatchUpPlanner'

const PARIS_SUMMER_OFFSET = -120 // Date.prototype.getTimezoneOffset() a Paris en ete

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

function task(over: Partial<CatchUpTask> & Pick<CatchUpTask, 'id' | 'scheduledFor'>): CatchUpTask {
  return {
    title: over.id,
    subjectId: null,
    subjectName: null,
    subjectDeadline: null,
    estimatedMinutes: 60,
    priority: 2,
    ...over,
  }
}

// Reference : mercredi 5 aout 2026, 10h00 a Paris.
const NOW = new Date('2026-08-05T08:00:00.000Z')
const YESTERDAY_19H = new Date('2026-08-04T17:00:00.000Z') // 19h00 a Paris

console.log('\n1. Helpers de jour local')
{
  // 23h30 le 4 aout a Paris = 21h30 UTC le 4 : meme jour local, jour UTC identique ici.
  const lateEvening = new Date('2026-08-04T21:30:00.000Z')
  check(
    'un bloc de 23h30 a Paris reste le 4 aout en local',
    localDayIndex(lateEvening, PARIS_SUMMER_OFFSET) ===
      localDayIndex(new Date('2026-08-04T10:00:00.000Z'), PARIS_SUMMER_OFFSET)
  )
  // 00h30 le 5 aout a Paris = 22h30 UTC le 4 : en UTC on croirait le 4.
  const justAfterMidnight = new Date('2026-08-04T22:30:00.000Z')
  check(
    'un bloc de 00h30 a Paris compte pour le 5 aout, pas le 4',
    localDayIndex(justAfterMidnight, PARIS_SUMMER_OFFSET) ===
      localDayIndex(NOW, PARIS_SUMMER_OFFSET)
  )
  check(
    'aller-retour jour + heure locale',
    fromLocalDayIndex(
      localDayIndex(YESTERDAY_19H, PARIS_SUMMER_OFFSET),
      localTimeOfDayMs(YESTERDAY_19H, PARIS_SUMMER_OFFSET),
      PARIS_SUMMER_OFFSET
    ).getTime() === YESTERDAY_19H.getTime()
  )
}

console.log("\n2. Le cas de la demo : 1 bloc sur 3 pas fait")
{
  const plan = planCatchUp([task({ id: 'Chapitre 7 - Thermochimie', scheduledFor: YESTERDAY_19H })], {
    now: NOW,
    tzOffsetMinutes: PARIS_SUMMER_OFFSET,
  })
  check('un seul deplacement', plan.moves.length === 1, plan.moves)
  check('part depuis hier', plan.moves[0].from === YESTERDAY_19H.toISOString())
  check(
    "atterrit dans l'horizon et pas dans le passe",
    new Date(plan.moves[0].to).getTime() >= NOW.getTime() - 24 * 3600 * 1000
  )
  check(
    "conserve l'heure du bloc (19h00 local)",
    localTimeOfDayMs(new Date(plan.moves[0].to), PARIS_SUMMER_OFFSET) ===
      localTimeOfDayMs(YESTERDAY_19H, PARIS_SUMMER_OFFSET)
  )
  check('7 jours decrits', plan.days.length === 7, plan.days.length)
  check('aucun depassement de capacite', plan.summary.overCapacityCount === 0)
}

console.log('\n3. Repartition : 6 blocs ne doivent pas tomber le meme jour')
{
  const tasks = Array.from({ length: 6 }, (_, i) =>
    task({ id: `bloc-${i + 1}`, scheduledFor: YESTERDAY_19H })
  )
  const plan = planCatchUp(tasks, { now: NOW, tzOffsetMinutes: PARIS_SUMMER_OFFSET })
  const uniqueDays = new Set(
    plan.moves.map((m) => localDayIndex(new Date(m.to), PARIS_SUMMER_OFFSET))
  )
  check('6 blocs replaces', plan.moves.length === 6)
  check('etales sur plusieurs jours', uniqueDays.size > 1, { jours: uniqueDays.size })
  check(
    'aucun jour au-dela de la capacite de 180 min',
    plan.days.every((d) => d.minutesAfter <= d.capacityMinutes),
    plan.days.map((d) => d.minutesAfter)
  )
  check('daysUsed coherent', plan.summary.daysUsed === uniqueDays.size, {
    daysUsed: plan.summary.daysUsed,
    uniqueDays: uniqueDays.size,
  })
  check('total de minutes exact', plan.summary.totalMinutes === 360)
}

console.log('\n4. La charge deja placee est respectee')
{
  // Aujourd'hui est deja plein (180 min), demain est vide.
  const existingLoad = [
    { scheduledFor: new Date('2026-08-05T09:00:00.000Z'), estimatedMinutes: 180 },
  ]
  const plan = planCatchUp([task({ id: 'bloc', scheduledFor: YESTERDAY_19H })], {
    now: NOW,
    tzOffsetMinutes: PARIS_SUMMER_OFFSET,
    existingLoad,
  })
  const landedOn = localDayIndex(new Date(plan.moves[0].to), PARIS_SUMMER_OFFSET)
  const today = localDayIndex(NOW, PARIS_SUMMER_OFFSET)
  check("ne s'empile pas sur une journee deja pleine", landedOn > today, {
    landedOn,
    today,
  })
  check('la charge de depart est reportee', plan.days[0].minutesBefore === 180)
}

console.log('\n5. La date limite de matiere borne le report')
{
  // Date limite dans 2 jours : le bloc ne peut pas partir plus loin.
  const deadline = new Date('2026-08-07T12:00:00.000Z')
  const plan = planCatchUp(
    [
      task({
        id: 'Chimie',
        scheduledFor: YESTERDAY_19H,
        subjectName: 'Chimie',
        subjectDeadline: deadline,
      }),
    ],
    { now: NOW, tzOffsetMinutes: PARIS_SUMMER_OFFSET }
  )
  const landed = localDayIndex(new Date(plan.moves[0].to), PARIS_SUMMER_OFFSET)
  check(
    'ne depasse pas la date limite',
    landed <= localDayIndex(deadline, PARIS_SUMMER_OFFSET),
    { landed, deadline: localDayIndex(deadline, PARIS_SUMMER_OFFSET) }
  )
  check('pas signale comme date limite passee', plan.summary.deadlinePassedCount === 0)
}

console.log('\n6. Date limite deja passee : signale, pas silencieux')
{
  const plan = planCatchUp(
    [
      task({
        id: 'Rendu en retard',
        scheduledFor: YESTERDAY_19H,
        subjectDeadline: new Date('2026-08-01T12:00:00.000Z'),
      }),
    ],
    { now: NOW, tzOffsetMinutes: PARIS_SUMMER_OFFSET }
  )
  check('signale deadlinePassed', plan.moves[0].deadlinePassed === true)
  check('compte dans le resume', plan.summary.deadlinePassedCount === 1)
  check(
    "remonte au plus tot (aujourd'hui)",
    localDayIndex(new Date(plan.moves[0].to), PARIS_SUMMER_OFFSET) ===
      localDayIndex(NOW, PARIS_SUMMER_OFFSET)
  )
}

console.log('\n7. Saturation : rien ne disparait en silence')
{
  // L'horizon accepte 7 x 180 = 1260 min, soit 21 blocs d'1h au maximum.
  // 25 blocs le saturent pour de bon.
  const tasks = Array.from({ length: 25 }, (_, i) =>
    task({ id: `bloc-${i + 1}`, scheduledFor: YESTERDAY_19H })
  )
  const plan = planCatchUp(tasks, { now: NOW, tzOffsetMinutes: PARIS_SUMMER_OFFSET })
  check('les 25 blocs sont replaces', plan.moves.length === 25)
  check('les depassements sont signales', plan.summary.overCapacityCount > 0, {
    over: plan.summary.overCapacityCount,
  })
  check(
    'aucun bloc sans date cible',
    plan.moves.every((m) => !Number.isNaN(new Date(m.to).getTime()))
  )
}

console.log('\n8. Ordre de traitement : le plus contraint sert en premier')
{
  const plan = planCatchUp(
    [
      task({ id: 'sans-limite', scheduledFor: YESTERDAY_19H, priority: 4 }),
      task({
        id: 'limite-demain',
        scheduledFor: YESTERDAY_19H,
        priority: 1,
        subjectDeadline: new Date('2026-08-06T12:00:00.000Z'),
      }),
    ],
    { now: NOW, tzOffsetMinutes: PARIS_SUMMER_OFFSET, dailyCapacityMinutes: 60 }
  )
  check(
    'le bloc a date limite proche est traite en premier',
    plan.moves[0].taskId === 'limite-demain',
    plan.moves.map((m) => m.taskId)
  )
  const limite = plan.moves.find((m) => m.taskId === 'limite-demain')!
  check(
    'et il respecte sa date limite malgre la capacite de 60 min',
    localDayIndex(new Date(limite.to), PARIS_SUMMER_OFFSET) <=
      localDayIndex(new Date('2026-08-06T12:00:00.000Z'), PARIS_SUMMER_OFFSET)
  )
}

console.log('\n9. estimatedMinutes absent ou invalide')
{
  const plan = planCatchUp(
    [
      task({ id: 'null', scheduledFor: YESTERDAY_19H, estimatedMinutes: null }),
      task({ id: 'zero', scheduledFor: YESTERDAY_19H, estimatedMinutes: 0 }),
      task({ id: 'negatif', scheduledFor: YESTERDAY_19H, estimatedMinutes: -30 }),
    ],
    { now: NOW, tzOffsetMinutes: PARIS_SUMMER_OFFSET }
  )
  check('retombe sur 30 min par defaut', plan.summary.totalMinutes === 90, plan.summary)
}

console.log('\n10. Liste vide')
{
  const plan = planCatchUp([], { now: NOW, tzOffsetMinutes: PARIS_SUMMER_OFFSET })
  check('aucun deplacement', plan.moves.length === 0)
  check('daysUsed a zero', plan.summary.daysUsed === 0)
  check("l'horizon est quand meme decrit", plan.days.length === 7)
}

console.log(`\n${checks - failures}/${checks} verifications passees`)
if (failures > 0) {
  console.error(`${failures} echec(s)`)
  process.exit(1)
}
