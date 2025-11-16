import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

import { useColorScheme } from '@/hooks/useColorScheme';
let SuperwallProvider: any = ({ children }: any) => children;
let useSuperwall: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SuperwallProvider = require('expo-superwall').SuperwallProvider;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  useSuperwall = require('expo-superwall').useSuperwall;
} catch (e) {
  // Superwall not available; render children directly
}

// Superwall integration removed

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  const superwallEnabled = false; // Temporairement désactivé

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {superwallEnabled ? (
        <SuperwallProvider apiKeys={{ ios: 'pk_6UQ2JnHcL0P6rvMJNDxZd', android: 'pk_6UQ2JnHcL0P6rvMJNDxZd' }} options={{ logging: true }}>
          {useSuperwall ? <IdentifyOnMount /> : null}
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="mon-espace" options={{ headerShown: false }} />
              <Stack.Screen name="achievements" options={{ headerShown: false }} />
              <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
              <Stack.Screen name="assistant-ia" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              <Stack.Screen name="parametres" options={{ headerShown: false }} />
              <Stack.Screen name="mon-entreprise" options={{ headerShown: false }} />
              <Stack.Screen name="support" options={{ headerShown: false }} />
              <Stack.Screen name="about" options={{ headerShown: false }} />
              <Stack.Screen name="time-history" options={{ headerShown: false }} />
              <Stack.Screen name="objectifs" options={{ headerShown: false }} />
              <Stack.Screen name="analytics" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SuperwallProvider>
      ) : (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="mon-espace" options={{ headerShown: false }} />
            <Stack.Screen name="achievements" options={{ headerShown: false }} />
            <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
            <Stack.Screen name="assistant-ia" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="parametres" options={{ headerShown: false }} />
            <Stack.Screen name="mon-entreprise" options={{ headerShown: false }} />
            <Stack.Screen name="support" options={{ headerShown: false }} />
            <Stack.Screen name="about" options={{ headerShown: false }} />
            <Stack.Screen name="time-history" options={{ headerShown: false }} />
            <Stack.Screen name="objectifs" options={{ headerShown: false }} />
            <Stack.Screen name="analytics" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      )}
    </GestureHandlerRootView>
  );
}

function IdentifyOnMount() {
  const superwall = useSuperwall?.();
  useEffect(() => {
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem('sw_user_id');
        const userId = storedId || `${Application.androidId || 'android'}-${Date.now()}`;
        if (!storedId) await AsyncStorage.setItem('sw_user_id', userId);
        await superwall?.identify(userId, {
          platform: 'android',
          appVersion: Application.nativeApplicationVersion || 'unknown',
          buildNumber: Application.nativeBuildVersion || 'unknown',
        });
        // Optionnel: forcer un refresh de l’état d’éligibilité
        await superwall?.preloadPaywalls?.();
      } catch (e) {
        console.warn('Superwall identify failed', e);
      }
    })();
  }, []);
  return null;
}
