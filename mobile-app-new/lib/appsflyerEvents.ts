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
 *
 * `revenue` est optionnel : côté client, Superwall ne communique pas le prix
 * payé (PaywallInfo.products n'expose que l'id et les entitlements). Envoyer un
 * montant supposé faussait le ROAS, on préfère donc un événement sans revenu.
 * Le montant réel n'existe que dans le webhook Superwall côté serveur
 * (data.priceInPurchasedCurrency + currencyCode) : c'est de là qu'il faut
 * envoyer le revenu en S2S si on veut un ROAS exploitable.
 */
export async function logSubscriptionEvent(params: {
  revenue?: number;
  currency?: string;
  plan?: 'monthly' | 'annual';
  productId?: string;
  transactionId?: string;
}) {
  const { revenue, currency = 'EUR', plan, productId, transactionId } = params;

  const contentId = productId || `pro_${plan || 'unknown'}`;
  const txId = transactionId || `sub_${contentId}_${Date.now()}`;
  if (await isDuplicate(txId)) {
    console.log('[AppsFlyer] af_subscribe déjà envoyé pour:', txId);
    return;
  }

  const userId = await getUserId();

  appsFlyer.logEvent(
    'af_subscribe',
    {
      ...(revenue !== undefined && { af_revenue: revenue, af_currency: currency }),
      af_content_type: 'subscription',
      af_content_id: contentId,
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
