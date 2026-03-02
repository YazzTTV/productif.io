import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSuperwall } from '@/hooks/useSuperwall';

export default function PaywallScreen() {
  const router = useRouter();
  const { showPaywall } = useSuperwall();

  useEffect(() => {
    showPaywall('campaign_trigger', undefined, () => {
      if (router.canGoBack()) {
        router.back();
      }
    });
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
}

