import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { getAuthToken } from '@/lib/api';

export default function Entry() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [token, onboardingFlag] = await Promise.all([
          getAuthToken(),
          AsyncStorage.getItem('onboarding_completed'),
        ]);

        if (token) {
          // Préserver la session : si token présent, on considère l'onboarding comme fait
          await AsyncStorage.setItem('onboarding_completed', 'true');
          router.replace('/(tabs)');
          return;
        }

        if (onboardingFlag === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/(onboarding-new)/intro');
        }
      } catch {
        router.replace('/(onboarding-new)/intro');
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
} 