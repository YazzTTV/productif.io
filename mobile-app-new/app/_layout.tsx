import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Constants from 'expo-constants';
import '@/utils/suppressWarnings'; // Supprimer les warnings NativeEventEmitter

// Stripe publishable key - from environment variables or app.json extra config
const STRIPE_PUBLISHABLE_KEY = 
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  Constants.expoConfig?.extra?.stripePublishableKey || 
  'pk_test_51...'; // Replace with your actual test key

function AppContent() {
  const { actualTheme } = useTheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

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
              name="stripe-checkout" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen 
              name="habits-manager" 
              options={{ 
                headerShown: false,
                gestureEnabled: true, // Permettre le retour vers (tabs)
              }} 
            />
            <Stack.Screen name="+not-found" />
          </Stack>
        <StatusBar style={actualTheme === 'dark' ? 'light' : 'dark'} />
      </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <ThemeProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </ThemeProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
