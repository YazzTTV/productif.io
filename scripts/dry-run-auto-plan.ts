/**
 * Simulation du recalcul de nuit sur la base reelle, SANS RIEN ECRIRE.
 *   npx tsx scripts/dry-run-auto-plan.ts
 * Les requetes Prisma construites pour l'ecriture ne sont jamais executees :
 * replanUser les rend avant $transaction en mode dryRun.
 */
import 'dotenv/config'
import { formatInTimeZone } from 'date-fns-tz'
import { prisma } from '../lib/prisma'
import { replanUser } from '../lib/planning/autoPlan'

async function main() {
  const candidates = await prisma.task.findMany({
    where: { completed: false, subjectId: { not: null }, user: { email: { not: { endsWith: '+deleted@productif.io' } } } },
    distinct: ['userId'],
    select: { userId: true, user: { select: { email: true } } },
  })
  for (const c of candidates) {
    const r = await replanUser(c.userId, 'nightly', new Date(), { dryRun: true })
    const tz = r.preview!.timeZone
    const perDay = new Map<string, number>()
    for (const b of r.preview!.blocks) {
      const k = formatInTimeZone(new Date(b.start), tz, 'EEE dd/MM')
      perDay.set(k, (perDay.get(k) ?? 0) + b.minutes)
    }
    console.log(`\n${c.user.email}  tz=${tz}  a_ecrire=${r.blocksWritten} retires=${r.unscheduled} non_places=${r.unplaced}${r.unplaced ? JSON.stringify(r.unplacedReasons) : ''} rattrapage=${r.catchUp} agendas=${r.busySources.join(',') || 'aucun'}`)
    console.log('   premiers blocs :', r.preview!.blocks.slice(0, 4).map((b) => formatInTimeZone(new Date(b.start), tz, 'EEE dd HH:mm') + ` (${b.minutes}m)`).join(' | '))
    console.log('   minutes/jour   :', [...perDay.entries()].slice(0, 7).map(([k, v]) => `${k} ${v}`).join(' | '))
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
