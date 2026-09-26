import { apiCall } from '@/lib/api';
import { ProductEvent } from '@/lib/analytics';

type ProductEventParams = Record<string, string | number | boolean | null | undefined>;

const BACKEND_EVENTS = new Set<ProductEvent>([
  'paywall_viewed',
  'paywall_dismissed',
  'purchase_completed',
  'purchase_restored',
  'study_plan_synced',
  'study_reminder_opened',
  'auto_block_scheduled',
  // Onboarding 1.5. Le serveur a la meme liste (app/api/user/product-events/route.ts) :
  // un nom present d'un seul cote est jete sans bruit.
  'onboarding_step_viewed',
  'onboarding_step_completed',
  'onboarding_calendar_choice',
  'onboarding_plan_built',
  'trial_cta_tapped',
  'paywall_skipped',
  'exam_free_session_started',
  'exam_free_session_completed',
  'first_planned_block_started',
]);

export async function trackBackendProductEvent(
  eventName: ProductEvent,
  params: ProductEventParams = {},
) {
  if (!BACKEND_EVENTS.has(eventName)) return;

  try {
    await apiCall('/user/product-events', {
      method: 'POST',
      body: JSON.stringify({ eventName, params }),
    }, 10000);
  } catch (error) {
    console.warn(`[ProductEvents] ${eventName} non envoyé au backend`, error);
  }
}
