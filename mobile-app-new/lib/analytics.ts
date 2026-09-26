import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';

export type ProductEvent =
  | 'analysis_opened'
  | 'analysis_evidence_opened'
  | 'analysis_action_opened'
  | 'analysis_session_started'
  | 'analysis_session_completed'
  | 'app_opened'
  | 'screen_view'
  | 'signup_started'
  | 'signup_completed'
  | 'onboarding_completed'
  | 'weekly_plan_generated'
  | 'weekly_plan_applied'
  | 'exam_mode_started'
  | 'paywall_viewed'
  | 'paywall_dismissed'
  | 'purchase_completed'
  | 'purchase_restored'
  | 'study_plan_synced'
  | 'study_reminder_opened'
  | 'auto_block_scheduled'
  // Onboarding 1.5 (contrat commun, point 6). Meme liste que la liste blanche
  // de lib/productEvents.ts et de app/api/user/product-events/route.ts.
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_calendar_choice'
  | 'onboarding_plan_built'
  | 'trial_cta_tapped'
  | 'paywall_skipped'
  | 'exam_free_session_started'
  | 'exam_free_session_completed'
  | 'first_planned_block_started';

type EventParams = Record<string, string | number | boolean | null | undefined>;

const cleanParams = (params: EventParams = {}) =>
  Object.fromEntries(
    Object.entries({ platform: Platform.OS, ...params })
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, typeof value === 'boolean' ? Number(value) : value]),
  );

/**
 * Point d'entrée unique des analytics produit. Aucune donnée scolaire, aucun
 * nom et aucun e-mail ne doivent être envoyés ici.
 */
export async function trackEvent(name: ProductEvent, params: EventParams = {}) {
  try {
    await analytics().logEvent(name, cleanParams(params));
  } catch (error) {
    // Les analytics ne doivent jamais empêcher une action utilisateur.
    console.warn(`[Analytics] ${name} non envoyé`, error);
  }
}

export async function identifyAnalyticsUser(userId: string | null) {
  try {
    await analytics().setUserId(userId);
  } catch (error) {
    console.warn('[Analytics] identification non envoyée', error);
  }
}

export async function trackScreen(pathname: string) {
  try {
    await analytics().logScreenView({
      screen_name: pathname,
      screen_class: pathname,
    });
  } catch (error) {
    console.warn('[Analytics] écran non envoyé', error);
  }
}
