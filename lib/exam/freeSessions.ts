/**
 * Seances Mode Examen offertes : le jeton de seance et la regle de
 * remboursement. Les compteurs vivent sur User (examFreeUsed, examFreeRefunded)
 * et les valeurs de la regle dans lib/plans.ts.
 *
 * Le jeton est rendu par POST /api/exam/start et renvoye par l'app a
 * POST /api/exam/cancel.
 *
 * Pourquoi un jeton signe et pas une ligne en base : il n'existe pas de table
 * de seances d'examen cote serveur (le « ExamSession » du mobile est son
 * stockage local, utils/examSession.ts), et le jeton n'a qu'une chose a prouver
 * a l'annulation : « ce serveur a lance une seance offerte pour CE compte a
 * CET instant ». L'heure de depart signee permet au serveur de mesurer lui-meme
 * le temps ecoule, au lieu de croire le chiffre envoye par l'app.
 *
 * Rejouer un jeton ne rapporte rien : le remboursement est plafonne par compte
 * (User.examFreeRefunded, decompte atomique), donc un meme jeton presente dix
 * fois ne rend qu'une seance, et un jeton de plus de 2 minutes n'en rend aucune.
 *
 * Cle : derivee de JWT_SECRET avec une etiquette propre, jamais JWT_SECRET
 * lui-meme. Un jeton de seance ne doit pas pouvoir passer pour un jeton de
 * connexion, ni l'inverse, meme si les deux formats se ressemblaient un jour.
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto"
import { JWT_SECRET } from "@/lib/config"
import { EXAM_FREE_REFUND_WINDOW_SECONDS } from "@/lib/plans"

const VERSION = 1
const KEY_LABEL = "productif.exam-free-session.v1"
/** Tolerance d'horloge entre instances : un iat « dans le futur » au-dela est refuse. */
const MAX_CLOCK_SKEW_MS = 60 * 1000
/** Au-dela, le jeton ne sert plus a rien (aucun remboursement possible), on le refuse. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

interface TokenPayload {
  v: number
  /** Identifiant du compte qui a lance la seance. */
  u: string
  /** Aleatoire : deux seances lancees a la meme milliseconde ont deux jetons. */
  n: string
  /** Lancement de la seance, en ms depuis l'epoque, horloge du serveur. */
  iat: number
}

let cachedKey: Buffer | null = null
function signingKey(): Buffer {
  if (!cachedKey) {
    if (!JWT_SECRET) throw new Error("JWT_SECRET manquant : impossible de signer un jeton de seance")
    cachedKey = createHmac("sha256", JWT_SECRET).update(KEY_LABEL).digest()
  }
  return cachedKey
}

function sign(encodedPayload: string): Buffer {
  return createHmac("sha256", signingKey()).update(encodedPayload).digest()
}

export function createFreeSessionToken(userId: string, now: Date = new Date()): string {
  const payload: TokenPayload = { v: VERSION, u: userId, n: randomBytes(9).toString("base64url"), iat: now.getTime() }
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${encoded}.${sign(encoded).toString("base64url")}`
}

/**
 * Heure de lancement de la seance si le jeton est authentique, emis pour ce
 * compte et encore utilisable ; null sinon. Ne leve jamais.
 */
export function verifyFreeSessionToken(token: unknown, userId: string, now: Date = new Date()): { startedAt: Date } | null {
  try {
    if (typeof token !== "string" || token.length > 512) return null
    const parts = token.split(".")
    if (parts.length !== 2) return null
    const [encoded, signature] = parts

    const expected = sign(encoded)
    const received = Buffer.from(signature, "base64url")
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<TokenPayload>
    if (payload.v !== VERSION || payload.u !== userId || typeof payload.iat !== "number" || !Number.isFinite(payload.iat)) {
      return null
    }
    const age = now.getTime() - payload.iat
    if (age < -MAX_CLOCK_SKEW_MS || age > MAX_AGE_MS) return null
    return { startedAt: new Date(payload.iat) }
  } catch {
    return null
  }
}

/** Marge ajoutee au seuil pour l'age du jeton mesure par le serveur (reseau lent, reessais). */
export const SERVER_CLOCK_SLACK_SECONDS = 30

/**
 * L'annulation tombe-t-elle dans le delai qui rend la seance ?
 *
 * Deux horloges, et les deux doivent etre sous le seuil :
 *   - clientElapsedSeconds, envoye par l'app, en horloge reelle (pauses
 *     comprises, sinon une pause d'une heure applis bloquees rendrait la seance) ;
 *   - l'age du jeton, mesure par le serveur depuis POST /api/exam/start. C'est
 *     lui qui empeche une app modifiee d'annoncer 5 s apres une heure de
 *     blocage. Il inclut les allers-retours reseau et le temps entre la reponse
 *     de /exam/start et le vrai depart de la seance, d'ou une marge.
 *
 * Le plafond par compte (EXAM_FREE_REFUND_LIMIT) n'est PAS juge ici : il l'est
 * dans l'UPDATE conditionnel de la route, seul endroit ou il est atomique.
 */
export function isInRefundWindow(clientElapsedSeconds: number, startedAt: Date, now: Date = new Date()): boolean {
  if (!Number.isFinite(clientElapsedSeconds) || clientElapsedSeconds < 0) return false
  const serverElapsedSeconds = (now.getTime() - startedAt.getTime()) / 1000
  return (
    clientElapsedSeconds < EXAM_FREE_REFUND_WINDOW_SECONDS &&
    serverElapsedSeconds < EXAM_FREE_REFUND_WINDOW_SECONDS + SERVER_CLOCK_SLACK_SECONDS
  )
}
