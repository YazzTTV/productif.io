import { User } from "@prisma/client"

export type PlanId = "free" | "premium"

export type PlanMyDayMode = "preview" | "full"

export interface PlanLimits {
  focusPerDay: number | null
  focusMaxDurationMinutes: number | null
  maxHabits: number | null
  planMyDayMode: PlanMyDayMode
  maxPlanMyDayEvents: number | null
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
    focusPerDay: 1,
    focusMaxDurationMinutes: 30,
    maxHabits: 3,
    planMyDayMode: "preview",
    maxPlanMyDayEvents: 3,
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
