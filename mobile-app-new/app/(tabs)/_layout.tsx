import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TabLayout() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  
  // Calcul dynamique de la hauteur de la TabBar pour Android avec navigation gestuelle
  const androidBottomPadding = Math.max(insets.bottom, 10);
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 60 + androidBottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: 'rgba(0, 0, 0, 0.4)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255, 255, 255, 0.98)',
          borderTopWidth: 0,
          elevation: Platform.OS === 'android' ? 8 : 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? 28 : androidBottomPadding,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView 
              intensity={80} 
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidTabBarBackground]} />
          )
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      {/* Home / Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* AI Agent */}
      <Tabs.Screen
        name="assistant"
        options={{
          title: t('ai'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="flash" 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Community / Leaderboard */}
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: t('community'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "people" : "people-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Hidden tabs */}
      <Tabs.Screen name="tasks" options={{ href: null }} />
      <Tabs.Screen name="mood" options={{ href: null }} />
      <Tabs.Screen name="projects" options={{ href: null }} />
      <Tabs.Screen name="timer" options={{ href: null }} />
      <Tabs.Screen name="habits" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderRadius: 12,
    padding: 8,
    marginBottom: -8,
  },
  androidTabBarBackground: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
});
