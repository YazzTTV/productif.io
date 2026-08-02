import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSuperwall } from '@/hooks/useSuperwall';
import { SUPERWALL_EVENTS } from '@/lib/superwallEvents';

export default function PaywallScreen() {
  const router = useRouter();
  const { showPaywall } = useSuperwall();

  useEffect(() => {
    showPaywall(SUPERWALL_EVENTS.CAMPAIGN_TRIGGER, undefined, () => {
      if (router.canGoBack()) {
        router.back();
      }
    });
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
}

