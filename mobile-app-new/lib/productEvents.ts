import { apiCall } from '@/lib/api';
import { ProductEvent } from '@/lib/analytics';

type ProductEventParams = Record<string, string | number | boolean | null | undefined>;

const BACKEND_EVENTS = new Set<ProductEvent>([
  'paywall_viewed',
  'paywall_dismissed',
  'purchase_completed',
  'purchase_restored',
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
