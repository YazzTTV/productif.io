import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { CopilotProvider } from 'react-native-copilot';
import { TutorialTooltip } from '@/tutorial/TutorialTooltip';
import SuperwallExpoModule, { SuperwallProvider } from 'expo-superwall';
import * as Linking from 'expo-linking';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import '@/utils/suppressWarnings'; // Supprimer les warnings NativeEventEmitter
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSuperwallUserSync } from '@/hooks/useSuperwallUserSync';
import { initAppCheck } from '@/lib/appCheck';
import { useAppsFlyer, flushQueuedAttribution, queueAttribution } from '@/hooks/useAppsFlyer';
import { useBlockingReconciliation } from '@/hooks/useBlockingReconciliation';
import { useProductAnalytics } from '@/hooks/useProductAnalytics';

function AppContent() {
  const { actualTheme } = useTheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  usePushNotifications();
  useSuperwallUserSync();
  useAppsFlyer();
  useBlockingReconciliation();
  useProductAnalytics();

  useEffect(() => {
    const onUrl = async (event: { url: string }) => {
      try {
        await (SuperwallExpoModule as any)?.handleDeepLink?.(event.url);
      } catch (e) {
        console.log('[DeepLink] Superwall error (non-fatal):', e);
      }

      // Capturer les paramètres depuis les URL scheme (productifio://...?af_sub1=...)
      // pour permettre l'attribution même sans passer par AppsFlyer OneLink.
      try {
        const parsed = Linking.parse(event.url);
        const queryParams = parsed.queryParams || {};
        const attributionKeys = [
          'af_sub1',
          'af_sub2',
          'af_sub3',
          'af_sub4',
          'af_sub5',
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
          'deep_link_value',
          'deep_link_sub1',
          'deep_link_sub2',
          'deep_link_sub3',
        ];
        const queueData = attributionKeys.reduce<Record<string, string>>((acc, key) => {
          const value = queryParams[key];
          if (typeof value === 'string' && value.trim()) acc[key] = value.trim();
          return acc;
        }, {});

        if (Object.keys(queueData).length > 0) {
          console.log('[DeepLink] attribution détectée:', queueData);
          await queueAttribution({
            media_source: queueData.media_source || queueData.pid || queueData.utm_source || 'direct_link',
            campaign: queueData.campaign || queueData.c || queueData.utm_campaign || null,
            ...queueData,
          });
          // Laisser le temps au TokenStorage de charger le token depuis AsyncStorage
          setTimeout(() => flushQueuedAttribution(), 2000);
        }
      } catch (e) {
        console.log('[DeepLink] Parse error (non-fatal):', e);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) onUrl({ url });
    });

    const subscription = Linking.addEventListener('url', onUrl);
    return () => subscription.remove();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <NavigationThemeProvider value={actualTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen 
                name="login" 
                options={{ 
                  headerShown: false,
                  gestureEnabled: false, // Empêcher le retour depuis login
                }} 
              />
              <Stack.Screen 
                name="signup" 
                options={{ 
                  headerShown: false,
                  gestureEnabled: false, // Empêcher le retour depuis signup
                }} 
              />
              <Stack.Screen 
                name="(tabs)" 
                options={{ 
                  headerShown: false,
                  gestureEnabled: false, // Empêcher le swipe vers la gauche depuis le tableau de bord
                  animationTypeForReplace: 'push', // Utiliser push pour éviter les animations de retour
                }} 
              />
            <Stack.Screen 
              name="(onboarding-new)" 
              options={{ 
                headerShown: false,
                gestureEnabled: false, // Désactiver le swipe pour revenir à l'onboarding
              }} 
            />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen 
              name="mon-espace" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="achievements" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="leaderboard" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="assistant-ia" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="notifications" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="parametres" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="mon-entreprise" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="support" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="about" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="exam" 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
              }} 
            />
            <Stack.Screen 
              name="paywall" 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
                presentation: 'modal',
              }} 
            />
            <Stack.Screen 
              name="time-history" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="objectifs" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="analytics" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="ent-webview" 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
              }} 
            />
            <Stack.Screen 
              name="habits-manager" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="(onboarding)" 
              options={{ 
                headerShown: false,
                gestureEnabled: false, // Désactiver le swipe pendant l'onboarding
              }} 
            />
            <Stack.Screen 
              name="focus" 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
                presentation: 'fullScreenModal',
              }} 
            />
            <Stack.Screen 
              name="tasks-new" 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
              }} 
            />
            <Stack.Screen 
              name="exam-mode" 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
              }} 
            />
            <Stack.Screen 
              name="review-habits" 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
              }} 
            />
            <Stack.Screen 
              name="plan-my-day" 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
              }} 
            />
            <Stack.Screen 
              name="invite" 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
              }} 
            />
            <Stack.Screen 
              name="verify-email" 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
              }} 
            />
            <Stack.Screen 
              name="daily-journal" 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
              }} 
            />
            <Stack.Screen name="+not-found" />
          </Stack>
        <StatusBar style={actualTheme === 'dark' ? 'light' : 'dark'} />
      </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [appCheckReady, setAppCheckReady] = useState(false);

  // Initialiser App Check le plus tôt possible (AVANT Google Sign-In)
  useEffect(() => {
    async function bootstrap() {
      try {
        await initAppCheck();
        console.log('✅ [RootLayout] App Check initialisé');
      } catch (error) {
        console.error('❌ [RootLayout] Erreur init App Check:', error);
        // En prod, on pourrait vouloir bloquer l'app ici
        // Pour l'instant, on continue quand même
      } finally {
        setAppCheckReady(true);
      }
    }
    bootstrap();
  }, []);

  // Optionnel: attendre que App Check soit prêt avant de rendre l'app
  // Décommentez si vous voulez bloquer le rendu jusqu'à l'init
  // if (!appCheckReady) {
  //   return null;
  // }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SuperwallProvider apiKeys={{ ios: 'pk_IYwjtBwdEBaR5WiSz8YQR' }}>
        <ThemeProvider>
          <LanguageProvider>
            <CopilotProvider
              animated
              overlay="view"
              backdropColor="rgba(55, 65, 81, 0.72)"
              tooltipComponent={TutorialTooltip}
              labels={{
                next: 'Suivant',
                previous: 'Retour',
                skip: 'Passer',
                finish: 'Terminer',
              }}
            >
              <AppContent />
            </CopilotProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SuperwallProvider>
    </GestureHandlerRootView>
  );
}
