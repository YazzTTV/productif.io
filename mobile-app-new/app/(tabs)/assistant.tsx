import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AIConductorNew } from '@/components/ai/AIConductorNew';
import AnalyticsScreen from './analytics';

type TabType = 'assistant' | 'analytics';

export default function AssistantScreen() {
  const params = useLocalSearchParams();
  const checkInType = params.checkInType as 'mood' | 'stress' | 'focus' | undefined;
  
  // Si on arrive depuis une notification avec checkInType, afficher directement Analytics
  const [activeTab, setActiveTab] = useState<TabType>(checkInType ? 'analytics' : 'assistant');

  return (
    <View style={styles.container}>
      {/* Tabs internes */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assistant' && styles.tabActive]}
          onPress={() => setActiveTab('assistant')}
        >
          <Text style={[styles.tabText, activeTab === 'assistant' && styles.tabTextActive]}>
            Assistant
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'assistant' ? (
        <AIConductorNew />
      ) : (
        <AnalyticsScreen checkInType={checkInType} isActive={activeTab === 'analytics'} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#16A34A',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#16A34A',
    fontWeight: '600',
  },
});
