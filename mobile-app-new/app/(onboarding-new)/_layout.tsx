import { Stack , router, useSegments } from 'expo-router';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function OnboardingNewLayout() {
  const [isChecking, setIsChecking] = useState(true);
  const segments = useSegments();
  const isMountedRef = useRef(true);
  const isNavigatingRef = useRef(false);

  const checkOnboardingStatus = useCallback(async () => {
    // Éviter les navigations concurrentes
    if (isNavigatingRef.current || !isMountedRef.current) {
      return false;
    }
    
    // Ne pas rediriger si on est sur la page stripe-webview (pour permettre les paiements)
    const currentRoute = segments[segments.length - 1];
    if (currentRoute === 'stripe-webview') {
      return false;
    }
    
    try {
      const flag = await AsyncStorage.getItem('onboarding_completed');
      if (flag === 'true' && isMountedRef.current && !isNavigatingRef.current) {
        // Marquer qu'on navigue pour éviter les doubles navigations
        isNavigatingRef.current = true;
        // Rediriger vers l'app si l'onboarding est déjà complété
        // Utiliser replace pour empêcher le retour en arrière
        router.replace('/(tabs)');
        return true; // Onboarding complété
      }
      return false; // Onboarding non complété
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }, [segments]);

  useEffect(() => {
    isMountedRef.current = true;
    isNavigatingRef.current = false;
    
    // Vérifier au montage
    checkOnboardingStatus().then((completed) => {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    });
    
    return () => {
      isMountedRef.current = false;
    };
  }, [checkOnboardingStatus]);

  // Vérifier à chaque fois que l'écran est focus (mais pas si on est déjà en train de naviguer)
  useFocusEffect(
    useCallback(() => {
      // Ne pas vérifier l'onboarding si on est sur stripe-webview
      const currentRoute = segments[segments.length - 1];
      if (currentRoute === 'stripe-webview') {
        return;
      }
      
      // Réinitialiser le flag de navigation quand on revient sur cet écran
      isNavigatingRef.current = false;
      checkOnboardingStatus();
    }, [checkOnboardingStatus, segments])
  );

  // Afficher un loader pendant la vérification
  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#00C27A" />
      </View>
    );
  }

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false, // Désactiver le swipe vers la gauche
        animationTypeForReplace: 'push', // Utiliser push pour éviter les animations de retour
      }}
    >
      <Stack.Screen 
        name="intro" 
        options={{
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="language" 
        options={{
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="connection" 
        options={{
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="question" 
        options={{
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="building-plan" 
        options={{
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="symptoms" 
        options={{
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="analyzing-symptoms" 
        options={{
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="social-proof" 
        options={{
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="profile-reveal" 
        options={{
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="stripe-webview" 
        options={{
          gestureEnabled: false,
          animation: 'none',
        }}
      />
    </Stack>
  );
}

