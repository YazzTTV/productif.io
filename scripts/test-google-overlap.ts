/**
 * Verifications de lib/planning/googleOverlap.ts.
 * npx tsx scripts/test-google-overlap.ts
 */
import { hasBusyOverlap, upcomingBlocks } from '../lib/planning/googleOverlap'

let failed = 0
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` : obtenu ${JSON.stringify(got)}, attendu ${JSON.stringify(want)}`}`)
}

const now = new Date('2026-09-26T12:00:00Z').getTime()
const at = (h: string) => new Date(`2026-09-26T${h}:00Z`)
const block = (s: string, e: string) => ({ start: at(s).toISOString(), end: at(e).toISOString() })

// Le cas du test P4 : WORK de 13:30 a 16:30 UTC, blocs a 13:30 et 14:10.
const work = [{ start: at('13:30'), end: at('16:30') }]
check('P4 : un bloc sous WORK est detecte', hasBusyOverlap([block('13:30', '14:00'), block('14:10', '14:40')], work, now), true)
check('aucun evenement : rien a faire', hasBusyOverlap([block('13:30', '14:00')], [], now), false)
check('bloc juste avant, bords qui se touchent : pas de chevauchement', hasBusyOverlap([block('13:00', '13:30')], work, now), false)
check('bloc juste apres, bords qui se touchent : pas de chevauchement', hasBusyOverlap([block('16:30', '17:00')], work, now), false)
check('chevauchement partiel sur la fin', hasBusyOverlap([block('13:15', '13:45')], work, now), true)
check('evenement contenu dans le bloc', hasBusyOverlap([block('13:00', '14:00')], [{ start: at('13:20'), end: at('13:25') }], now), true)
check('bloc deja commence : jamais deplace', hasBusyOverlap([block('11:50', '12:20')], [{ start: at('11:00'), end: at('13:00') }], now), false)
check('bloc qui commence dans 30 s : considere en cours', upcomingBlocks([block('12:00', '12:30')].map((b) => ({ ...b, start: new Date(now + 30_000).toISOString() })), now).length, 0)
check('bloc qui commence dans 2 min : a venir', upcomingBlocks([{ start: new Date(now + 120_000).toISOString(), end: at('13:00').toISOString() }], now).length, 1)
check('accepte des Date autant que des chaines', hasBusyOverlap([{ start: at('13:30'), end: at('14:00') }], work, now), true)

console.log(failed === 0 ? '\nTout passe.' : `\n${failed} echec(s).`)
process.exit(failed === 0 ? 0 : 1)
