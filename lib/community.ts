/**
 * Communaute : amis par code, groupes par code, classement de la semaine.
 *
 * Le classement porte sur les MINUTES DE REVISION des 7 derniers jours, lues
 * dans `StudySession` (seances Focus et Mode Examen synchronisees par l'app,
 * segments valides par lib/study-analysis/validation.ts). Pas sur les points :
 * ils se gagnent en cochant des taches, donc en cliquant, et ils s'accumulent
 * depuis toujours, ce qui fige le classement sur les anciens comptes.
 *
 * Fenetre glissante de 7 x 24 h, identique pour tout le monde : des amis a
 * Montreal et a Paris comparent la meme periode, sans question de fuseau.
 *
 * Aucune adresse email ne sort d'ici. Le nom affiche est « Prenom I. ».
 */

import { randomInt } from "crypto"
import { prisma } from "@/lib/prisma"
import { unionMilliseconds, type Segment } from "@/lib/study-analysis/engine"

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000
/** Une seance compte a partir de 5 minutes enregistrees. */
const MIN_SESSION_SECONDS = 5 * 60
export const GLOBAL_LIMIT = 20
// Seules les seances reelles comptent. La base contient aussi des seances
// injectees pour tester l'ecran Analyse (source `codex_seed_analytics_v1`,
// 25 lignes sur un compte au 28 septembre) : sans ce filtre, elles gonflent
// le classement.
const REAL_SOURCES = ["exam", "focus"]
// Le www est obligatoire : sans lui, productif.io repond 308.
export const SHARE_BASE_URL = "https://www.productif.io/rejoindre"

// Sans 0/O ni 1/I/L : le code se dicte et se recopie a la main.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
export const CODE_LENGTH = 6

export function generateCode(): string {
  let code = ""
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  return code
}

/** Tolere les espaces, tirets et minuscules d'un code recopie a la main. */
export function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string") return null
  const code = input.replace(/[\s-]/g, "").toUpperCase()
  if (code.length < 4 || code.length > 32 || !/^[A-Z0-9]+$/.test(code)) return null
  return code
}

async function codeIsFree(code: string): Promise<boolean> {
  const [user, group] = await Promise.all([
    prisma.user.findUnique({ where: { friendCode: code }, select: { id: true } }),
    prisma.leaderboardGroup.findUnique({ where: { inviteCode: code }, select: { id: true } }),
  ])
  return !user && !group
}

/**
 * Un code libre dans les DEUX espaces (amis et groupes) : l'app n'a qu'un seul
 * champ « J'ai un code », le serveur doit pouvoir dire a quoi il correspond.
 */
export async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateCode()
    if (await codeIsFree(code)) return code
  }
  throw new Error("Impossible de generer un code unique")
}

export async function ensureFriendCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { friendCode: true } })
  if (existing?.friendCode) return existing.friendCode
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = await generateUniqueCode()
    // Ecriture conditionnelle : deux ouvertures simultanees ne donnent pas deux codes.
    const updated = await prisma.user
      .updateMany({ where: { id: userId, friendCode: null }, data: { friendCode: code } })
      .catch(() => null) // collision sur l'index unique : on retente
    if (updated) {
      const row = await prisma.user.findUnique({ where: { id: userId }, select: { friendCode: true } })
      if (row?.friendCode) return row.friendCode
    }
  }
  throw new Error("Impossible d'attribuer un code ami")
}

export function displayName(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "Étudiant"
  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  return parts.length > 1 ? `${first} ${parts[1].charAt(0).toUpperCase()}.` : first
}

export async function getFriendIds(userId: string): Promise<string[]> {
  const rows = await prisma.friendship.findMany({ where: { userId }, select: { friendId: true } })
  return rows.map((r) => r.friendId)
}

export type CommunityEntry = {
  userId: string
  name: string
  rank: number
  weekMinutes: number
  weekSessions: number
  level: number
  isMe: boolean
  isFriend: boolean
}

type WeekStats = { minutes: number; sessions: number }

/** Minutes et seances de la semaine pour un ensemble d'utilisateurs. */
export async function weekStats(userIds: string[], now = Date.now()): Promise<Map<string, WeekStats>> {
  const start = now - WEEK_MS
  const result = new Map<string, WeekStats>(userIds.map((id) => [id, { minutes: 0, sessions: 0 }]))
  if (userIds.length === 0) return result
  const sessions = await prisma.studySession.findMany({
    // Une seance commencee avant la fenetre peut y deborder : on la prend et on la coupe.
    where: {
      userId: { in: userIds },
      source: { in: REAL_SOURCES },
      startedAt: { gte: new Date(start - 24 * 60 * 60 * 1000) },
    },
    select: { userId: true, segments: true },
  })
  const byUser = new Map<string, Segment[][]>()
  for (const s of sessions) {
    const segments = Array.isArray(s.segments) ? (s.segments as Segment[]) : []
    const list = byUser.get(s.userId) ?? []
    list.push(segments)
    byUser.set(s.userId, list)
  }
  for (const [userId, list] of byUser) {
    // Union : deux seances qui se chevauchent (Focus et Examen) ne comptent qu'une fois.
    const totalMs = unionMilliseconds(list.flat(), start, now)
    const count = list.filter((segs) => unionMilliseconds(segs, start, now) >= MIN_SESSION_SECONDS * 1000).length
    result.set(userId, { minutes: Math.floor(totalMs / 60000), sessions: count })
  }
  return result
}

/** Classe un ensemble de comptes. Egalite de minutes : le plus de seances, puis le niveau. */
export async function rankUsers(
  userIds: string[],
  meId: string,
  friendIds: Set<string>,
): Promise<CommunityEntry[]> {
  const ids = [...new Set(userIds)]
  const [users, stats] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, gamification: { select: { level: true } } },
    }),
    weekStats(ids),
  ])
  return users
    .map((u) => {
      const s = stats.get(u.id) ?? { minutes: 0, sessions: 0 }
      return {
        userId: u.id,
        name: displayName(u.name),
        rank: 0,
        weekMinutes: s.minutes,
        weekSessions: s.sessions,
        level: u.gamification?.level ?? 1,
        isMe: u.id === meId,
        isFriend: friendIds.has(u.id),
      }
    })
    .sort(
      (a, b) =>
        b.weekMinutes - a.weekMinutes ||
        b.weekSessions - a.weekSessions ||
        b.level - a.level ||
        Number(b.isMe) - Number(a.isMe),
    )
    .map((e, i) => ({ ...e, rank: i + 1 }))
}

/** Top de la semaine parmi tous les comptes qui ont revise, plus la ligne de l'utilisateur. */
export async function globalRanking(meId: string, friendIds: Set<string>) {
  const start = new Date(Date.now() - WEEK_MS - 24 * 60 * 60 * 1000)
  const active = await prisma.studySession.findMany({
    where: { startedAt: { gte: start }, source: { in: REAL_SOURCES } },
    select: { userId: true },
    distinct: ["userId"],
  })
  const ranked = await rankUsers([...active.map((a) => a.userId), meId], meId, friendIds)
  const withTime = ranked
    .filter((e) => e.weekMinutes > 0 || e.isMe)
    .map((e, i) => ({ ...e, rank: i + 1 }))
  const me = withTime.find((e) => e.isMe) ?? null
  return { entries: withTime.slice(0, GLOBAL_LIMIT), me, total: withTime.length }
}
