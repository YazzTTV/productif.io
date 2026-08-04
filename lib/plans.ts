import { User } from "@prisma/client"

export type PlanId = "free" | "premium"

export type PlanMyDayMode = "preview" | "full"

/**
 * Rattrapage des blocs non faits : "preview" laisse voir la redistribution
 * proposee mais pas l'appliquer, "full" l'applique. Meme logique que
 * planMyDayMode : le gratuit voit la valeur avant de payer.
 */
export type CatchUpMode = "preview" | "full"

export interface PlanLimits {
  focusPerDay: number | null
  focusMaxDurationMinutes: number | null
  maxHabits: number | null
  planMyDayMode: PlanMyDayMode
  maxPlanMyDayEvents: number | null
  catchUpMode: CatchUpMode
  allowGlobalLeaderboard: boolean
  analyticsRetentionDays: number | null
  historyDepthDays: number | null
  examModeEnabled: boolean
}

export interface PlanInfo {
  plan: PlanId
  isPremium: boolean
  limits: PlanLimits
}

export interface LockedFeature {
  locked: true
  feature: string
  requiredPlan: PlanId
  limits: PlanLimits
  message?: string
}

const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    focusPerDay: 2,
    focusMaxDurationMinutes: 25,
    maxHabits: 3,
    planMyDayMode: "preview",
    maxPlanMyDayEvents: 3,
    catchUpMode: "preview",
    allowGlobalLeaderboard: false,
    analyticsRetentionDays: 7,
    historyDepthDays: 7,
    examModeEnabled: false,
  },
  premium: {
    focusPerDay: null,
    focusMaxDurationMinutes: null,
    maxHabits: null,
    planMyDayMode: "full",
    maxPlanMyDayEvents: null,
    catchUpMode: "full",
    allowGlobalLeaderboard: true,
    analyticsRetentionDays: null,
    historyDepthDays: null,
    examModeEnabled: true,
  },
}

const PREMIUM_STATUSES = new Set(["active", "trialing", "paid"])
const PREMIUM_TIERS = new Set(["pro", "premium", "starter", "enterprise", "paid"])

/**
 * Derive the plan from the user record without introducing a migration.
 * - Active subscription OR premium tier => premium
 * - Default => free
 *
 * Les achats passent desormais uniquement par Superwall (StoreKit), qui met a
 * jour subscriptionStatus / subscriptionTier via le webhook. La condition
 * stripeSubscriptionId est conservee volontairement pour ne pas retirer l'acces
 * aux abonnes Stripe historiques : on a coupe les nouvelles ventes Stripe, pas
 * les abonnements deja payes. A ne retirer qu'apres verification en base qu'il
 * ne reste aucun abonne Stripe actif.
 */
export function resolvePlan(user: Pick<User, "subscriptionStatus" | "subscriptionTier" | "stripeSubscriptionId">): PlanId {
  if (
    (user.subscriptionStatus && PREMIUM_STATUSES.has(user.subscriptionStatus)) ||
    (user.subscriptionTier && PREMIUM_TIERS.has(user.subscriptionTier.toLowerCase())) ||
    user.stripeSubscriptionId
  ) {
    return "premium"
  }
  return "free"
}

export function getPlanInfo(user: Pick<User, "subscriptionStatus" | "subscriptionTier" | "stripeSubscriptionId">): PlanInfo {
  const plan = resolvePlan(user)
  return {
    plan,
    isPremium: plan === "premium",
    limits: PLAN_LIMITS[plan],
  }
}

export function buildLockedFeature(feature: string, message?: string): LockedFeature {
  return {
    locked: true,
    feature,
    requiredPlan: "premium",
    limits: PLAN_LIMITS.premium,
    ...(message ? { message } : {}),
  }
}

export function getPlanLimits(plan: PlanId): PlanLimits {
  return PLAN_LIMITS[plan]
}
