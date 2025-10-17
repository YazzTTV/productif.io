import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function Entry() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const flag = await AsyncStorage.getItem('onboarding_completed');
        if (flag === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding/welcome');
        }
      } catch {
        router.replace('/onboarding/welcome');
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