import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { getAuthToken } from '@/lib/api';
import { getRestorableFocusSession } from '@/utils/focusSession';

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

          // Une session focus encore en cours reprend la main sur le dashboard.
          // C'est indispensable depuis que le bouclier survit à la mort de
          // l'app : sans ça, l'utilisateur relance l'app, voit son écran
          // d'accueil habituel, et n'a aucun moyen de comprendre pourquoi ses
          // applications sont bloquées ni d'y mettre fin.
          const runningFocus = await getRestorableFocusSession();
          if (runningFocus) {
            router.replace('/focus');
            return;
          }

          router.replace('/(tabs)');
          return;
        }

        if (onboardingFlag === 'true') {
          router.replace('/(tabs)');
        } else {
          // Si pas de token et pas d'onboarding, rediriger vers la page de connexion
          router.replace('/(onboarding-new)/connection');
        }
      } catch {
        router.replace('/(onboarding-new)/connection');
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