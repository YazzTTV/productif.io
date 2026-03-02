import appsFlyer from 'react-native-appsflyer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/lib/api';

const PURCHASE_DEDUP_PREFIX = 'af_purchase_sent_';

async function getUserId(): Promise<string | null> {
  try {
    const user = await authService.checkAuth();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function isDuplicate(transactionId: string): Promise<boolean> {
  const key = `${PURCHASE_DEDUP_PREFIX}${transactionId}`;
  const existing = await AsyncStorage.getItem(key);
  if (existing) return true;
  await AsyncStorage.setItem(key, new Date().toISOString());
  return false;
}

/**
 * Log un événement d'abonnement dans AppsFlyer pour l'attribution de revenu.
 * Déduplication automatique par transactionId.
 */
export async function logSubscriptionEvent(params: {
  revenue: number;
  currency?: string;
  plan: 'monthly' | 'annual';
  transactionId?: string;
}) {
  const { revenue, currency = 'EUR', plan, transactionId } = params;

  const txId = transactionId || `sub_${plan}_${Date.now()}`;
  if (await isDuplicate(txId)) {
    console.log('[AppsFlyer] af_subscribe déjà envoyé pour:', txId);
    return;
  }

  const userId = await getUserId();

  appsFlyer.logEvent(
    'af_subscribe',
    {
      af_revenue: revenue,
      af_currency: currency,
      af_content_type: 'subscription',
      af_content_id: `pro_${plan}`,
      af_order_id: txId,
      ...(userId && { customer_user_id: userId }),
    },
    (result) => {
      console.log('[AppsFlyer] af_subscribe logged:', result);
    },
    (error) => {
      console.error('[AppsFlyer] af_subscribe error:', error);
    }
  );
}

/**
 * Log un événement d'achat générique dans AppsFlyer.
 */
export async function logPurchaseEvent(params: {
  revenue: number;
  currency?: string;
  contentId: string;
  contentType?: string;
  transactionId?: string;
}) {
  const { revenue, currency = 'EUR', contentId, contentType = 'one_time', transactionId } = params;

  const txId = transactionId || `purchase_${contentId}_${Date.now()}`;
  if (await isDuplicate(txId)) {
    console.log('[AppsFlyer] af_purchase déjà envoyé pour:', txId);
    return;
  }

  const userId = await getUserId();

  appsFlyer.logEvent(
    'af_purchase',
    {
      af_revenue: revenue,
      af_currency: currency,
      af_content_type: contentType,
      af_content_id: contentId,
      af_order_id: txId,
      ...(userId && { customer_user_id: userId }),
    },
    (result) => {
      console.log('[AppsFlyer] af_purchase logged:', result);
    },
    (error) => {
      console.error('[AppsFlyer] af_purchase error:', error);
    }
  );
}

/**
 * Log le début d'un trial dans AppsFlyer.
 */
export async function logTrialStartEvent() {
  const userId = await getUserId();

  appsFlyer.logEvent(
    'af_start_trial',
    {
      af_content_type: 'subscription',
      af_content_id: 'pro_trial',
      ...(userId && { customer_user_id: userId }),
    },
    (result) => {
      console.log('[AppsFlyer] af_start_trial logged:', result);
    },
    (error) => {
      console.error('[AppsFlyer] af_start_trial error:', error);
    }
  );
}
