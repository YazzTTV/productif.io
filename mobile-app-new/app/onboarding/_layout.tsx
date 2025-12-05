import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="value" />
      <Stack.Screen name="social" />
      <Stack.Screen name="survey" />
      <Stack.Screen name="brand" />
      <Stack.Screen name="paywall" />
    </Stack>
  );
}
