/**
 * Test des regles du Mode Examen offert (mobile-app-new/utils/examAccessRules.ts),
 * sans telephone ni reseau.
 *   npx tsx scripts/test-exam-access-rules.ts
 *
 * Meme convention que scripts/test-study-planner.ts : pas de runner, on
 * execute et on lit le resultat.
 */

import {
  decideExamAccess,
  isServerPremium,
  freeCancelSecondsLeft,
  canLeaveExamSession,
  clampExamDuration,
  withPlannedTaskFirst,
  wallClockElapsedSeconds,
  FREE_SESSION_CANCEL_GRACE_SECONDS,
} from '../mobile-app-new/utils/examAccessRules'
import type { TaskForExam } from '../mobile-app-new/utils/taskSelection'

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

const freeUser = (remaining: number | null | undefined) => ({
  isPremium: false,
  planLimits: { examModeEnabled: false },
  examFreeRemaining: remaining,
})
const premiumUser = { isPremium: true, planLimits: { examModeEnabled: true }, examFreeRemaining: null }

console.log('decideExamAccess')
{
  const a = decideExamAccess({ hasToken: false, user: premiumUser, storeActive: true })
  check('sans jeton : aucun acces, meme premium et StoreKit actif', !a.canStart && !a.premium, a)

  const b = decideExamAccess({ hasToken: true, user: premiumUser, storeActive: false })
  check('premium serveur : acces illimite, source serveur', b.premium && b.canStart && b.premiumSource === 'server' && b.freeRemaining === null, b)

  const c = decideExamAccess({ hasToken: true, user: freeUser(0), storeActive: true })
  check('gratuit serveur mais StoreKit actif (webhook en retard, restauration) : premium, source store', c.premium && c.canStart && c.premiumSource === 'store', c)

  const d = decideExamAccess({ hasToken: true, user: null, storeActive: true })
  check('/auth/me en echec mais StoreKit actif : premium (la session en cours survit)', d.premium && d.canStart, d)

  const e = decideExamAccess({ hasToken: true, user: null, storeActive: false })
  check('/auth/me en echec sans StoreKit : fail-closed', !e.canStart && !e.premium, e)

  const f = decideExamAccess({ hasToken: true, user: freeUser(2), storeActive: false })
  check('gratuit avec 2 seances : peut lancer, pas premium', f.canStart && !f.premium && f.freeRemaining === 2, f)

  const g = decideExamAccess({ hasToken: true, user: freeUser(0), storeActive: false })
  check('gratuit a 0 seance : ne peut pas lancer', !g.canStart && g.freeRemaining === 0, g)

  const h = decideExamAccess({ hasToken: true, user: freeUser(undefined), storeActive: false })
  check('serveur anterieur a la 1.5 (champ absent) : aucune seance supposee', !h.canStart && h.freeRemaining === null, h)

  const i = decideExamAccess({ hasToken: true, user: freeUser(-3), storeActive: false })
  check('nombre negatif ramene a 0', !i.canStart && i.freeRemaining === 0, i)

  const j = decideExamAccess({ hasToken: true, user: freeUser(1.7), storeActive: false })
  check('nombre non entier arrondi par defaut', j.canStart && j.freeRemaining === 1, j)

  const k = decideExamAccess({ hasToken: true, user: freeUser(Number.NaN), storeActive: false })
  check('NaN traite comme absent', !k.canStart && k.freeRemaining === null, k)
}

console.log('isServerPremium')
{
  check('planLimits fait foi quand il est la', !isServerPremium({ isPremium: true, planLimits: { examModeEnabled: false } }))
  check('repli sur isPremium sans planLimits', isServerPremium({ isPremium: true }))
  check('null : non', !isServerPremium(null))
}

console.log('fenetre d annulation')
{
  const now = 1_000_000_000_000
  const startedAt = now - 30_000
  check('seance offerte a 30 s : 90 s restantes', freeCancelSecondsLeft({ freeSession: true, startedAt }, now) === FREE_SESSION_CANCEL_GRACE_SECONDS - 30)
  check('seance offerte a 2 min pile : fenetre fermee', freeCancelSecondsLeft({ freeSession: true, startedAt: now - 120_000 }, now) === 0)
  check('seance premium : jamais de fenetre', freeCancelSecondsLeft({ freeSession: false, startedAt }, now) === 0)
  check('horloge reelle, pauses comprises', wallClockElapsedSeconds(now - 3_600_000, now) === 3600)
  check('horloge qui recule : 0 et non negatif', wallClockElapsedSeconds(now + 5_000, now) === 0)

  check('hard mode premium : pas de sortie', !canLeaveExamSession({ hardMode: true, freeSession: false, startedAt }, { allTasksDone: false, now }))
  check('hard mode, toutes les taches faites : sortie', canLeaveExamSession({ hardMode: true, freeSession: false, startedAt }, { allTasksDone: true, now }))
  check('hard mode, seance offerte dans la fenetre : sortie', canLeaveExamSession({ hardMode: true, freeSession: true, startedAt }, { allTasksDone: false, now }))
  check('hard mode, seance offerte apres la fenetre : pas de sortie', !canLeaveExamSession({ hardMode: true, freeSession: true, startedAt: now - 300_000 }, { allTasksDone: false, now }))
  check('sans hard mode : sortie', canLeaveExamSession({ hardMode: false, startedAt: now - 300_000 }, { allTasksDone: false, now }))
}

console.log('clampExamDuration')
{
  check('bloc de 30 min garde 30', clampExamDuration(30, 25, 180) === 30)
  check('bloc de 10 min remonte a 25', clampExamDuration(10, 25, 180) === 25)
  check('bloc de 300 min plafonne a 180', clampExamDuration(300, 25, 180) === 180)
  check('parametre absent : null', clampExamDuration(Number(undefined), 25, 180) === null)
}

console.log('withPlannedTaskFirst')
{
  const task = (id: string): TaskForExam => ({
    id,
    title: `Chapitre ${id}`,
    subjectId: 's1',
    subjectName: 'Anatomie',
    subjectCoefficient: 5,
    estimatedTime: 30,
    priority: 'medium',
    completed: false,
    priorityScore: 10,
  })
  const primary = task('a')
  const next = [task('b'), task('c'), task('d')]

  const same = withPlannedTaskFirst(primary, next, {})
  check('sans bloc touche : selection inchangee', same.primary?.id === 'a' && same.next.length === 3)

  const moved = withPlannedTaskFirst(primary, next, { taskId: 'c' })
  check('bloc present : passe en tete', moved.primary?.id === 'c', moved.primary)
  check('bloc present : les autres suivent, sans doublon', moved.next.map((t) => t.id).join(',') === 'a,b,d', moved.next.map((t) => t.id))
  check('bloc present : garde son coefficient', moved.primary?.subjectCoefficient === 5)

  const rebuilt = withPlannedTaskFirst(primary, next, {
    taskId: 'z',
    title: 'Chapitre lointain',
    subjectId: 's2',
    subjectName: 'Histologie',
    minutes: '45',
  })
  check('bloc absent des 4 : reconstruit depuis le planning', rebuilt.primary?.id === 'z' && rebuilt.primary?.title === 'Chapitre lointain', rebuilt.primary)
  check('bloc reconstruit : coefficient inconnu (0, non affiche)', rebuilt.primary?.subjectCoefficient === 0)
  check('bloc reconstruit : 3 suivants au plus', rebuilt.next.length === 3 && rebuilt.next[0].id === 'a')

  const empty = withPlannedTaskFirst(null, [], { taskId: 'z', title: 'Seul' })
  check('aucune tache chargee : le bloc touche suffit', empty.primary?.id === 'z' && empty.next.length === 0)
}

console.log(`\n${checks - failures}/${checks} verifications passees`)
if (failures > 0) process.exit(1)
