import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BrandLoadingScreen() {
  const [ready, setReady] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleContinue = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.inner}>
        <View style={styles.content}>
          <View style={styles.topLogo}>
            <View style={styles.logoCircle}>
              <Image source={require('../../assets/images/productif-logo.png')} style={styles.logoImg} />
            </View>
          </View>
          <Text style={styles.title}>Productif.io</Text>
          <Text style={styles.subtitle}>{t('legacyBrandSubtitle')}</Text>
          <View style={{ height: 24 }} />
          {!ready && (
            <>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>{t('legacyAnalyzingResponses')}</Text>
            </>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.cta, !ready && { opacity: 0.3 }]} 
          disabled={!ready} 
          onPress={handleContinue}
        >
          <Text style={styles.ctaText}>{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECFEF5' },
  inner: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { alignItems: 'center', paddingTop: 16 },
  topLogo: { alignItems: 'center' },
  logoCircle: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  logoImg: { width: 72, height: 72, resizeMode: 'contain' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 12 },
  subtitle: { color: '#374151' },
  loadingText: { marginTop: 8, color: '#374151' },
  cta: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
