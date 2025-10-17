import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

export default function SocialProofScreen() {
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
          <Text style={styles.big}>Rejoignez Productif.io</Text>
          <Text style={styles.desc}>Comme des milliers d'étudiants et de pros, structurez vos journées, progressez chaque jour et gardez le cap.</Text>
        </View>
        <TouchableOpacity style={styles.cta} onPress={() => router.replace('/onboarding/survey')}>
          <Text style={styles.ctaText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECFEF5' },
  inner: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 28, gap: 12 },
  topLogo: { alignItems: 'center' },
  logoCircle: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, overflow: 'hidden' },
  logoImg: { width: 72, height: 72, resizeMode: 'contain' },
  big: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center', marginTop: 8 },
  desc: { color: '#374151', textAlign: 'center' },
  cta: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
