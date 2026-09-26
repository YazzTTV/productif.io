export const SUPERWALL_EVENTS = {
  CAMPAIGN_TRIGGER: 'campaign_trigger',
  USER_FIRST_ACTION: 'user_first_action',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FOCUS_COMPLETED: 'focus_completed',
  FEATURE_LOCKED: 'feature_locked',
  STREAK_STARTED: 'streak_started',
  // Onboarding 1.5 : bouton « Activer le blocage automatique » de l'ecran
  // d'essai, apres le planning. Placement a creer dans le tableau de bord
  // Superwall ; tant qu'il n'existe pas, le SDK rend la main sans rien afficher
  // et l'ecran journalise `paywall_skipped`.
  ONBOARDING_TRIAL_CTA: 'onboarding_trial_cta',
} as const;

export type SuperwallEventName =
  (typeof SUPERWALL_EVENTS)[keyof typeof SUPERWALL_EVENTS];
