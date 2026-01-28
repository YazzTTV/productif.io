import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AIConductorNew } from '@/components/ai/AIConductorNew';
import AnalyticsScreen from './analytics';
import { useLanguage } from '@/contexts/LanguageContext';

type TabType = 'assistant' | 'analytics';

export default function AssistantScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  const router = useRouter();
  const checkInType = params.checkInType as 'mood' | 'stress' | 'focus' | undefined;
  
  // Si on arrive depuis une notification avec checkInType, afficher directement Analytics
  const [activeTab, setActiveTab] = useState<TabType>(checkInType ? 'analytics' : 'assistant');

  // Gérer le bouton retour Android pour éviter l'erreur GO_BACK
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      try {
        // Essayer de revenir en arrière si possible
        if (router.canGoBack && router.canGoBack()) {
          router.back();
        } else {
          // Si on ne peut pas revenir (ex: arrivé depuis une notification), aller au dashboard
          router.replace('/(tabs)');
        }
      } catch (error) {
        // En cas d'erreur (ex: GO_BACK non géré), rediriger vers le dashboard
        console.log('⚠️ Erreur lors du retour, redirection vers dashboard:', error);
        router.replace('/(tabs)');
      }
      return true; // Empêcher le comportement par défaut
    });

    return () => backHandler.remove();
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Tabs internes */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assistant' && styles.tabActive]}
          onPress={() => setActiveTab('assistant')}
        >
          <Text style={[styles.tabText, activeTab === 'assistant' && styles.tabTextActive]}>
            {t('assistantTab') || 'Assistant'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
            {t('analyticsTab') || 'Analytics'}
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
