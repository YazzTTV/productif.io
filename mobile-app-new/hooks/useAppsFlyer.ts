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

async function sendAttributionToBackend(conversionData: Record<string, any>): Promise<boolean> {
  if (sendingAttribution) return false;
  sendingAttribution = true;

  try {
    const flagKey = await getAttributionFlagKey();
    if (!flagKey) {
      await queueAttribution(conversionData);
      return false;
    }

    const alreadySent = await AsyncStorage.getItem(flagKey);
    if (alreadySent) return false;

    const referredBy = conversionData.af_sub1 || conversionData.af_referrer || null;
    const attributionSource = conversionData.media_source || null;

    if (!referredBy && !attributionSource) return false;

    const installId = await getOrCreateInstallId();

    const payload = {
      referredBy,
      attributionSource,
      attributionProvider: 'appsflyer',
      installId,
      attributionData: {
        media_source: conversionData.media_source || null,
        campaign: conversionData.campaign || null,
        adgroup: conversionData.adgroup || null,
        adset: conversionData.adset || null,
        af_sub1: conversionData.af_sub1 || null,
        af_sub2: conversionData.af_sub2 || null,
        af_sub3: conversionData.af_sub3 || null,
        af_sub4: conversionData.af_sub4 || null,
        af_sub5: conversionData.af_sub5 || null,
        af_channel: conversionData.af_channel || null,
        af_ad: conversionData.af_ad || null,
        af_adset: conversionData.af_adset || null,
        af_status: conversionData.af_status || null,
        install_time: conversionData.install_time || null,
        click_time: conversionData.click_time || null,
      },
    };

    console.log(
      `[AppsFlyer→Backend] provider=appsflyer media_source=${attributionSource} campaign=${conversionData.campaign || '-'} af_sub1=${referredBy || '-'} deep_link_sub1=${conversionData.deep_link_sub1 || '-'} is_first_launch=${conversionData.is_first_launch ?? '-'}`
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

async function queueAttribution(data: Record<string, any>) {
  try {
    await AsyncStorage.setItem(ATTRIBUTION_QUEUE_KEY, JSON.stringify(data));
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
      (result) => {
        console.log('[AppsFlyer] SDK initialisé:', result);
        setCustomerUserIdAndFlush();
      },
      (error) => {
        console.error('[AppsFlyer] Erreur init SDK:', error);
      }
    );

    const onInstallConversionData = appsFlyer.onInstallConversionData((res) => {
      console.log('[AppsFlyer] onInstallConversionData:', JSON.stringify(res?.data, null, 2));

      const data = res?.data;
      if (!data) return;

      sendAttributionToBackend(data);
    });

    const onDeepLink = appsFlyer.onDeepLink((res) => {
      console.log('[AppsFlyer] Deep link:', res?.deepLinkStatus, res?.deepLinkValue);

      if (res?.deepLinkStatus === 'FOUND' && res?.data) {
        const afSub1 = res.data.af_sub1 || res.data.deep_link_sub1;
        if (afSub1) {
          sendAttributionToBackend({
            af_sub1: afSub1,
            media_source: res.data.media_source || 'deep_link',
            campaign: res.data.campaign,
            ...res.data,
          });
        }
      }
    });

    return () => {
      onInstallConversionData();
      onDeepLink();
    };
  }, []);
}
