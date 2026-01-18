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
    </Stack>
  );
}
