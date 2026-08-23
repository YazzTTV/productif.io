import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';

export type ProductEvent =
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
  | 'purchase_restored';

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
