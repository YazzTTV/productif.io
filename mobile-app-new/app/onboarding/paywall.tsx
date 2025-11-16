import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

let usePlacement: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  usePlacement = require('expo-superwall').usePlacement;
} catch (e) {
  usePlacement = null;
}

export default function PaywallScreen() {
  const [selected, setSelected] = useState<'annual' | 'monthly'>('annual');

  const placementApi = useMemo(() => {
    if (!usePlacement) return null;
    return usePlacement({
      onError: (err: any) => console.error('Placement Error:', err),
      onPresent: (info: any) => console.log('Paywall Presented:', info),
      onDismiss: async (_info: any, _result: any) => {
        try {
          await AsyncStorage.setItem('onboarding_completed', 'true');
          await AsyncStorage.setItem('selected_plan', selected);
        } finally {
          router.replace('/(tabs)');
        }
      },
    });
  }, [selected]);

  const handleStart = async () => {
    console.log('🚀 Paywall handleStart called');
    
    // Temporairement désactivé Superwall - continuer directement vers le dashboard
    console.log('⚠️ Superwall temporairement désactivé, continuant vers le dashboard');
    await AsyncStorage.setItem('onboarding_completed', 'true');
    await AsyncStorage.setItem('selected_plan', selected);
    router.replace('/(tabs)');
    
    /* Code Superwall désactivé temporairement
    const tryRegister = async (attempt: number): Promise<boolean> => {
      if (!placementApi?.registerPlacement) {
        console.error('❌ placementApi.registerPlacement not available');
        return false;
      }
      try {
        console.log(`🔄 Attempting registerPlacement (attempt ${attempt})`);
        await placementApi.registerPlacement({ placement: 'campaign_trigger' });
        console.log('✅ registerPlacement succeeded');
        return true;
      } catch (e: any) {
        const msg = String(e?.message || e);
        console.error(`❌ registerPlacement attempt ${attempt} failed:`, msg);
        // Retry on transient Billing timeouts/service unavailable
        if (attempt < 3 && (msg.includes('Timeout') || msg.includes('ErrorCode: 2') || msg.includes('SERVICE_UNAVAILABLE'))) {
          console.log(`⏳ Retrying in ${2000 * attempt}ms...`);
          await new Promise(r => setTimeout(r, 2000 * attempt));
          return tryRegister(attempt + 1);
        }
        return false;
      }
    };

    const ok = await tryRegister(1);
    if (ok) {
      console.log('✅ Paywall registration successful, staying on paywall screen');
      return;
    }

    console.log('⚠️ Paywall registration failed, continuing to dashboard');
    await AsyncStorage.setItem('onboarding_completed', 'true');
    await AsyncStorage.setItem('selected_plan', selected);
    router.replace('/(tabs)');
    */
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
          <Text style={styles.title}>Passez au niveau supérieur</Text>
          <Text style={styles.subtitle}>Débloquez le meilleur de Productif.io</Text>
        </View>

        <View style={styles.plans}>
          <TouchableOpacity style={[styles.planCard, selected === 'annual' && styles.planSelected]} onPress={() => setSelected('annual')}>
            <View style={styles.planHeaderRow}>
              <Text style={styles.planTitle}>119 € / an</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>Recommandé</Text></View>
            </View>
            <Text style={styles.saving}>Économie 60,88 € ✅</Text>
            <Text style={styles.planHint}>Facturation annuelle</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.planCard, selected === 'monthly' && styles.planSelected]} onPress={() => setSelected('monthly')}>
            <Text style={styles.planTitle}>14,99 € / mois</Text>
            <Text style={styles.planHint}>Facturation mensuelle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cta} onPress={handleStart}>
            <Text style={styles.ctaText}>Démarrer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={ignore}>
            <Text style={styles.link}>Ignorer</Text>
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
