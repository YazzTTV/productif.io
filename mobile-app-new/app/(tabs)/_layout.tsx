import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/hooks/useTranslation';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const t = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00C27A',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard'),
          tabBarIcon: ({ color }) => <Ionicons name="home" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: t('assistant'),
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={26} color={color} />,
        }}
      />
      {/* Hidden tabs - accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="tasks"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
