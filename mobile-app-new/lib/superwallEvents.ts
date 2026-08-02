export const SUPERWALL_EVENTS = {
  CAMPAIGN_TRIGGER: 'campaign_trigger',
  USER_FIRST_ACTION: 'user_first_action',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FOCUS_COMPLETED: 'focus_completed',
  FEATURE_LOCKED: 'feature_locked',
  STREAK_STARTED: 'streak_started',
} as const;

export type SuperwallEventName =
  (typeof SUPERWALL_EVENTS)[keyof typeof SUPERWALL_EVENTS];
