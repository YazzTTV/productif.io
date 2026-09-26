import { Stack, router, useSegments, usePathname } from 'expo-router';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/** Écrans du groupe (onboarding-new) qu’on doit pouvoir ouvrir après `onboarding_completed=true` (ex. didacticiel → sync calendrier). */
const SKIP_COMPLETED_ONBOARDING_REDIRECT = new Set([
  'calendar-sync',
  // Onboarding 1.5 : un utilisateur existant sans matiere doit pouvoir etre
  // envoye sur les ecrans du planning par la carte « Construis ton planning »
  // (spec, cas limites). Sans cette exception, `onboarding_completed=true` le
  // renverrait aussitot sur les onglets.
  'exams',
  'subjects',
  'chapters',
  'courses',
  // La suite du meme chemin, jusqu'au bout : calcul, planning, ecran d'essai et
  // ses deux sorties. Sans elles, l'utilisateur existant qui construit son
  // planning depuis la carte etait renvoye sur les onglets des le calcul.
  'building-plan',
  'planning',
  'trial',
  'premium-setup',
  'free-sessions',
]);

export default function OnboardingNewLayout() {
  const [isChecking, setIsChecking] = useState(true);
  const segments = useSegments();
  const pathname = usePathname();
  const isMountedRef = useRef(true);
  const isNavigatingRef = useRef(false);

  const checkOnboardingStatus = useCallback(async () => {
    // Éviter les navigations concurrentes
    if (isNavigatingRef.current || !isMountedRef.current) {
      return false;
    }
    
    const currentRoute = segments[segments.length - 1];
    const allowIncompleteSegment =
      pathname != null &&
      [...SKIP_COMPLETED_ONBOARDING_REDIRECT].some((name) => pathname.includes(name));
    if (
      (currentRoute && SKIP_COMPLETED_ONBOARDING_REDIRECT.has(currentRoute)) ||
      allowIncompleteSegment
    ) {
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
  }, [segments, pathname]);

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
      const currentRoute = segments[segments.length - 1];
      const allowIncompleteSegment =
        pathname != null &&
        [...SKIP_COMPLETED_ONBOARDING_REDIRECT].some((name) => pathname.includes(name));
      if (
        (currentRoute && SKIP_COMPLETED_ONBOARDING_REDIRECT.has(currentRoute)) ||
        allowIncompleteSegment
      ) {
        return;
      }
      
      // Réinitialiser le flag de navigation quand on revient sur cet écran
      isNavigatingRef.current = false;
      checkOnboardingStatus();
    }, [checkOnboardingStatus, segments, pathname])
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
    </Stack>
  );
}

