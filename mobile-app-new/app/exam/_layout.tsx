import { Stack } from 'expo-router';

export default function ExamLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="preview" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen
        name="session"
        options={{
          headerShown: false,
          // Le hard mode masque les boutons Terminer et Pause et intercepte le
          // retour Android, mais le geste de retour iOS sortait quand même de
          // la session : la contrainte qu'on vend était contournable d'un
          // glissement de pouce. La sortie passe désormais par les boutons de
          // l'écran, qui eux respectent le hard mode.
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="setup" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen
        name="summary"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="blocked-apps"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
