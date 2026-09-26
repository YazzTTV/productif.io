/**
 * Verifications de la signature Svix du webhook Superwall.
 * npx tsx scripts/test-superwall-webhook-signature.ts
 */
import { createHmac } from 'crypto'
import { verifySvixSignature } from '../lib/superwall/svix'

let failed = 0
const check = (name: string, ok: boolean) => { if (!ok) failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`) }

const keyBytes = Buffer.from('cle-de-test-pour-svix-0123456789')
const secret = `whsec_${keyBytes.toString('base64')}`
const body = '{"type":"renewal","data":{"id":"x"}}'
const id = 'msg_test'
const now = 1_790_000_000
const sign = (b: string, ts: number, k = keyBytes) => createHmac('sha256', k).update(`${id}.${ts}.${b}`).digest('base64')

check('signature valide acceptee', verifySvixSignature(body, { id, timestamp: String(now), signature: `v1,${sign(body, now)}` }, secret, now))
check('plusieurs signatures, une valide', verifySvixSignature(body, { id, timestamp: String(now), signature: `v1,AAAA v1,${sign(body, now)}` }, secret, now))
check('corps modifie refuse', !verifySvixSignature(body + ' ', { id, timestamp: String(now), signature: `v1,${sign(body, now)}` }, secret, now))
check('mauvais secret refuse', !verifySvixSignature(body, { id, timestamp: String(now), signature: `v1,${sign(body, now, Buffer.from('autre'))}` }, secret, now))
check('horodatage de plus de 5 min refuse (rejeu)', !verifySvixSignature(body, { id, timestamp: String(now - 400), signature: `v1,${sign(body, now - 400)}` }, secret, now))
check('en-tetes absents refuses', !verifySvixSignature(body, { id: null, timestamp: String(now), signature: `v1,${sign(body, now)}` }, secret, now))
check('version inconnue refusee', !verifySvixSignature(body, { id, timestamp: String(now), signature: `v2,${sign(body, now)}` }, secret, now))
check('secret sans prefixe whsec_ accepte', verifySvixSignature(body, { id, timestamp: String(now), signature: `v1,${sign(body, now)}` }, keyBytes.toString('base64'), now))

console.log(failed === 0 ? '\nTout passe.' : `\n${failed} echec(s).`)
process.exit(failed === 0 ? 0 : 1)
