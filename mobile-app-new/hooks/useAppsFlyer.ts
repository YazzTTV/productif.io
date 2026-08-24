import { useEffect } from 'react';
import appsFlyer from 'react-native-appsflyer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall, authService } from '@/lib/api';

import * as Crypto from 'expo-crypto';

const APPSFLYER_DEV_KEY = 'axPv245UKhRFj9wrTjqZtd';
const APPSFLYER_APP_ID = '6755625569';
const ATTRIBUTION_SENT_PREFIX = 'af_attribution_sent_';
const ATTRIBUTION_QUEUE_KEY = 'af_attribution_queue';
const INSTALL_ID_KEY = 'app_install_id';
const ATTRIBUTION_SIGNAL_KEYS = [
  'af_sub1',
  'af_sub2',
  'af_sub3',
  'af_sub4',
  'af_sub5',
  'af_referrer',
  'media_source',
  'pid',
  'campaign',
  'c',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'af_channel',
  'af_ad',
  'af_keywords',
  'deep_link_value',
  'deep_link_sub1',
  'deep_link_sub2',
  'deep_link_sub3',
];

type AppsFlyerConversionResponse = {
  data?: Record<string, any>;
};

type AppsFlyerDeepLinkResponse = AppsFlyerConversionResponse & {
  deepLinkStatus?: string;
  deepLinkValue?: string;
};

// ── In-flight lock (mémoire) pour éviter double POST au même launch ──
let sendingAttribution = false;

async function getAttributionFlagKey(): Promise<string | null> {
  try {
    const user = await authService.checkAuth();
    return user?.id ? `${ATTRIBUTION_SENT_PREFIX}${user.id}` : null;
  } catch {
    return null;
  }
}

async function getOrCreateInstallId(): Promise<string> {
  try {
    let installId = await AsyncStorage.getItem(INSTALL_ID_KEY);
    if (!installId) {
      installId = Crypto.randomUUID();
      await AsyncStorage.setItem(INSTALL_ID_KEY, installId);
    }
    return installId;
  } catch {
    return 'unknown';
  }
}

function getString(data: Record<string, any>, keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  }
  return null;
}

function hasAttributionSignal(data: Record<string, any>): boolean {
  return ATTRIBUTION_SIGNAL_KEYS.some((key) => {
    const value = data[key];
    return typeof value === 'string' ? value.trim().length > 0 : value != null;
  });
}

function normalizeAttributionData(data: Record<string, any>): Record<string, any> {
  const mediaSource = getString(data, ['media_source', 'pid', 'utm_source']);
  const campaign = getString(data, ['campaign', 'c', 'utm_campaign']);
  const channel = getString(data, ['af_channel', 'utm_medium']);
  const content = getString(data, ['af_ad', 'af_sub2', 'utm_content', 'deep_link_sub3']);

  return {
    ...data,
    media_source: mediaSource,
    campaign,
    af_channel: channel,
    af_ad: content,
    af_keywords: getString(data, ['af_keywords', 'utm_term']),
    af_sub1: getString(data, ['af_sub1', 'af_referrer']),
    af_sub2: content,
    af_sub3: getString(data, ['af_sub3', 'placement']),
    af_sub4: getString(data, ['af_sub4', 'path']),
    af_sub5: getString(data, ['af_sub5', 'locale']),
    deep_link_value: getString(data, ['deep_link_value']),
    deep_link_sub1: getString(data, ['deep_link_sub1']),
    deep_link_sub2: getString(data, ['deep_link_sub2']),
    deep_link_sub3: getString(data, ['deep_link_sub3']),
  };
}

async function sendAttributionToBackend(conversionData: Record<string, any>): Promise<boolean> {
  if (sendingAttribution) return false;
  sendingAttribution = true;

  try {
    const normalizedData = normalizeAttributionData(conversionData);

    const flagKey = await getAttributionFlagKey();
    if (!flagKey) {
      await queueAttribution(normalizedData);
      return false;
    }

    const alreadySent = await AsyncStorage.getItem(flagKey);
    if (alreadySent) return false;

    const referredBy = normalizedData.af_sub1 || null;
    const attributionSource = normalizedData.media_source || null;

    if (!referredBy && !attributionSource) return false;

    const installId = await getOrCreateInstallId();

    const payload = {
      referredBy,
      attributionSource,
      attributionProvider: 'appsflyer',
      installId,
      attributionData: {
        media_source: normalizedData.media_source || null,
        campaign: normalizedData.campaign || null,
        adgroup: normalizedData.adgroup || null,
        adset: normalizedData.adset || null,
        af_sub1: normalizedData.af_sub1 || null,
        af_sub2: normalizedData.af_sub2 || null,
        af_sub3: normalizedData.af_sub3 || null,
        af_sub4: normalizedData.af_sub4 || null,
        af_sub5: normalizedData.af_sub5 || null,
        af_channel: normalizedData.af_channel || null,
        af_ad: normalizedData.af_ad || null,
        af_adset: normalizedData.af_adset || null,
        af_keywords: normalizedData.af_keywords || null,
        deep_link_value: normalizedData.deep_link_value || null,
        deep_link_sub1: normalizedData.deep_link_sub1 || null,
        deep_link_sub2: normalizedData.deep_link_sub2 || null,
        deep_link_sub3: normalizedData.deep_link_sub3 || null,
        af_status: normalizedData.af_status || null,
        install_time: normalizedData.install_time || null,
        click_time: normalizedData.click_time || null,
      },
    };

    console.log(
      `[AppsFlyer→Backend] provider=appsflyer media_source=${attributionSource} campaign=${normalizedData.campaign || '-'} af_sub1=${referredBy || '-'} af_sub2=${normalizedData.af_sub2 || '-'} deep_link_sub1=${normalizedData.deep_link_sub1 || '-'} is_first_launch=${normalizedData.is_first_launch ?? '-'}`
    );

    await apiCall('/user/attribution', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    await AsyncStorage.setItem(flagKey, new Date().toISOString());
    await AsyncStorage.removeItem(ATTRIBUTION_QUEUE_KEY);
    console.log('[AppsFlyer] Attribution envoyée au backend');
    return true;
  } catch (e) {
    console.log('[AppsFlyer] Erreur envoi attribution (retry next launch):', e);
    return false;
  } finally {
    sendingAttribution = false;
  }
}

// ── Queue locale : stocke les données si user pas connecté ──

export async function queueAttribution(data: Record<string, any>) {
  try {
    const normalizedData = normalizeAttributionData(data);
    if (!hasAttributionSignal(normalizedData)) return;

    await AsyncStorage.setItem(ATTRIBUTION_QUEUE_KEY, JSON.stringify(normalizedData));
    console.log('[AppsFlyer] Attribution mise en queue (user pas connecté)');
  } catch {
    // Pas critique
  }
}

export async function flushQueuedAttribution() {
  try {
    const raw = await AsyncStorage.getItem(ATTRIBUTION_QUEUE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    await sendAttributionToBackend(data);
  } catch {
    // Pas critique
  }
}

// ── setCustomerUserId + flush queue post-login ──

async function setCustomerUserIdAndFlush() {
  try {
    const user = await authService.checkAuth();
    if (user?.id) {
      appsFlyer.setCustomerUserId(user.id);
      console.log('[AppsFlyer] customerUserId set:', user.id);
      // Le user est maintenant connecté → flush la queue d'attribution
      await flushQueuedAttribution();
    }
  } catch {
    // Pas encore connecté
  }
}

// ── Hook principal ──

export function useAppsFlyer() {
  useEffect(() => {
    appsFlyer.initSdk(
      {
        devKey: APPSFLYER_DEV_KEY,
        isDebug: __DEV__,
        appId: APPSFLYER_APP_ID,
        onInstallConversionDataListener: true,
        onDeepLinkListener: true,
        timeToWaitForATTUserAuthorization: 10,
      },
      (result: unknown) => {
        console.log('[AppsFlyer] SDK initialisé:', result);
        setCustomerUserIdAndFlush();
      },
      (error: unknown) => {
        console.error('[AppsFlyer] Erreur init SDK:', error);
      }
    );

    const onInstallConversionData = appsFlyer.onInstallConversionData((res: AppsFlyerConversionResponse | null) => {
      console.log('[AppsFlyer] onInstallConversionData:', JSON.stringify(res?.data, null, 2));

      const data = res?.data;
      if (!data) return;

      sendAttributionToBackend(data);
    });

    const onDeepLink = appsFlyer.onDeepLink((res: AppsFlyerDeepLinkResponse | null) => {
      console.log('[AppsFlyer] Deep link:', res?.deepLinkStatus, res?.deepLinkValue);

      if (res?.deepLinkStatus === 'FOUND' && res?.data) {
        sendAttributionToBackend({
          media_source: res.data.media_source || res.data.pid || 'deep_link',
          campaign: res.data.campaign || res.data.c,
          ...res.data,
        });
      }
    });

    return () => {
      onInstallConversionData();
      onDeepLink();
    };
  }, []);
}
