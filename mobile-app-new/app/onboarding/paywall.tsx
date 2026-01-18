import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PaywallScreen() {
  const [selected, setSelected] = useState<'annual' | 'monthly'>('annual');
  const { t } = useLanguage();

  const handleStart = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    await AsyncStorage.setItem('selected_plan', selected);
    router.replace('/(tabs)');
  };

  const ignore = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    await AsyncStorage.setItem('free_trial_mode', 'true');
    await AsyncStorage.setItem('selected_plan', 'free');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.inner}>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>{t('legacyPaywallTitle')}</Text>
          <Text style={styles.subtitle}>{t('legacyPaywallSubtitle')}</Text>
        </View>

        <View style={styles.plans}>
          <TouchableOpacity style={[styles.planCard, selected === 'annual' && styles.planSelected]} onPress={() => setSelected('annual')}>
            <View style={styles.planHeaderRow}>
              <Text style={styles.planTitle}>{t('legacyPlanAnnual')}</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{t('legacyPlanRecommended')}</Text></View>
            </View>
            <Text style={styles.saving}>{t('legacyPlanSaving')}</Text>
            <Text style={styles.planHint}>{t('legacyPlanHintAnnual')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.planCard, selected === 'monthly' && styles.planSelected]} onPress={() => setSelected('monthly')}>
            <Text style={styles.planTitle}>{t('legacyPlanMonthly')}</Text>
            <Text style={styles.planHint}>{t('legacyPlanHintMonthly')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cta} onPress={handleStart}>
            <Text style={styles.ctaText}>{t('legacyPaywallStart')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={ignore}>
            <Text style={styles.link}>{t('legacyPaywallSkip')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  inner: { flex: 1, padding: 24, justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { color: '#374151', marginBottom: 16 },
  plans: { gap: 12 },
  planCard: { backgroundColor: '#fff', width: '100%', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  planSelected: { borderColor: '#10B981', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  planHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  saving: { color: '#065F46', marginTop: 4, fontWeight: '700' },
  planHint: { color: '#6B7280', marginTop: 2 },
  badge: { backgroundColor: '#10B98120', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#10B981', fontWeight: '700', fontSize: 12 },
  actions: { alignItems: 'center' },
  cta: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center', width: '100%', marginTop: 4 },
  ctaText: { color: '#fff', fontWeight: '700' },
  link: { color: '#10B981', marginTop: 10 },
});
