import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingNewLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="intro" />
      <Stack.Screen name="language" />
      <Stack.Screen name="connection" />
      <Stack.Screen name="building-plan" />
      <Stack.Screen name="symptoms" />
      <Stack.Screen name="analyzing-symptoms" />
      <Stack.Screen name="social-proof" />
      <Stack.Screen name="profile-reveal" />
      <Stack.Screen name="stripe-webview" />
    </Stack>
  );
}

