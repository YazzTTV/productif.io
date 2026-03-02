import { usePlacement } from 'expo-superwall';
import { logSubscriptionEvent } from '@/lib/appsflyerEvents';

export function useSuperwall() {
  const { registerPlacement, state } = usePlacement({
    onError: (err) => console.error('[Superwall] Placement error:', err),
    onPresent: (info) => console.log('[Superwall] Paywall presented:', info),
    onDismiss: (info, result) => {
      console.log('[Superwall] Paywall dismissed:', info, 'Result:', result);
      if (result === 'purchased' || result === 'restored') {
        logSubscriptionEvent({ revenue: 59.99, plan: 'annual' });
      }
    },
  });

  const showPaywall = async (
    placement = 'campaign_trigger',
    params?: Record<string, any>,
    feature?: () => void,
  ) => {
    await registerPlacement({ placement, params, feature });
  };

  return { showPaywall, paywallState: state };
}
