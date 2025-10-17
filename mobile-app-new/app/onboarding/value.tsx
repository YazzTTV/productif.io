import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const slides = [
  {
    emoji: '⏱️',
    title: 'Suivi du temps',
    headline: 'Gagnez 2h par jour avec le Pomodoro',
    points: [
      'Sessions focalisées avec pauses intelligentes',
      'Historique clair de vos journées',
      'Pilotez vos process pas à pas',
    ],
  },
  {
    emoji: '✅',
    title: 'Tâches & Projets',
    headline: 'Priorités limpides, exécution rapide',
    points: [
      'Capture rapide, priorisation et échéances',
      'Regroupez par projets, assignez, suivez',
      'Un bouton: “Faire la tâche” → focus immédiat',
    ],
  },
  {
    emoji: '🌿',
    title: 'Habitudes',
    headline: 'Construisez une discipline durable',
    points: [
      'Streaks motivants et retour visuel',
      'Habitude “Apprentissage” avec notes',
      'Gestes rapides et feedback instantané',
    ],
  },
  {
    emoji: '🤖',
    title: 'Assistant IA',
    headline: 'Votre copilote de productivité',
    points: [
      'Plan de journée, priorités, relances',
      'Conseils personnalisés selon vos données',
      'Intégration WhatsApp pour agir partout',
    ],
  },
];

export default function ValueScreen() {
  const [index, setIndex] = useState(0);

  const next = () => {
    if (index < slides.length - 1) setIndex(index + 1);
    else router.replace('/onboarding/social');
  };

  const s = slides[index];
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.inner}>
        <View style={styles.centerArea}>
          <View style={styles.card}>
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={styles.kicker}>{s.title}</Text>
            <Text style={styles.headline}>{s.headline}</Text>
            <View style={styles.points}>
              {s.points.map((p, i) => (
                <View key={i} style={styles.pointRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.pointText}>{p}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.cta} onPress={next}><Text style={styles.ctaText}>{index < slides.length - 1 ? 'Suivant' : 'Continuer'}</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  inner: { flex: 1, padding: 24, justifyContent: 'space-between' },
  centerArea: { flex: 1, justifyContent: 'center' },
  card: { backgroundColor: '#fff', padding: 28, borderRadius: 24, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  emoji: { fontSize: 52, textAlign: 'center' },
  kicker: { textAlign: 'center', color: '#10B981', fontWeight: '700', marginTop: 2 },
  headline: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center' },
  points: { marginTop: 8, gap: 8 },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pointText: { color: '#374151', flexShrink: 1 },
  cta: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
