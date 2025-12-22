import { Stack } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function OnboardingNewLayout() {
  const [isChecking, setIsChecking] = useState(true);
  const segments = useSegments();

  const checkOnboardingStatus = async () => {
    try {
      const flag = await AsyncStorage.getItem('onboarding_completed');
      if (flag === 'true') {
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
  };

  useEffect(() => {
    // Vérifier au montage
    checkOnboardingStatus().then((completed) => {
      setIsChecking(false);
    });
  }, []);

  // Vérifier à chaque fois que l'écran est focus
  useFocusEffect(
    useCallback(() => {
      checkOnboardingStatus();
    }, [])
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

