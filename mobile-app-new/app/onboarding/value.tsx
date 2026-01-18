import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ValueScreen() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const slides = [
    {
      emoji: '⏱️',
      title: t('legacyValueTimeTitle', undefined, 'Suivi du temps'),
      headline: t('legacyValueTimeHeadline', undefined, 'Gagnez 2h par jour avec le Pomodoro'),
      points: [
        t('legacyValueTimePoint1', undefined, 'Sessions focalisées avec pauses intelligentes'),
        t('legacyValueTimePoint2', undefined, 'Historique clair de vos journées'),
        t('legacyValueTimePoint3', undefined, 'Pilotez vos process pas à pas'),
      ],
    },
    {
      emoji: '✅',
      title: t('legacyValueTasksTitle', undefined, 'Tâches & Projets'),
      headline: t('legacyValueTasksHeadline', undefined, 'Priorités limpides, exécution rapide'),
      points: [
        t('legacyValueTasksPoint1', undefined, 'Capture rapide, priorisation et échéances'),
        t('legacyValueTasksPoint2', undefined, 'Regroupez par projets, assignez, suivez'),
        t('legacyValueTasksPoint3', undefined, 'Un bouton: “Faire la tâche” → focus immédiat'),
      ],
    },
    {
      emoji: '🌿',
      title: t('legacyValueHabitsTitle', undefined, 'Habitudes'),
      headline: t('legacyValueHabitsHeadline', undefined, 'Construisez une discipline durable'),
      points: [
        t('legacyValueHabitsPoint1', undefined, 'Streaks motivants et retour visuel'),
        t('legacyValueHabitsPoint2', undefined, 'Habitude “Apprentissage” avec notes'),
        t('legacyValueHabitsPoint3', undefined, 'Gestes rapides et feedback instantané'),
      ],
    },
    {
      emoji: '🤖',
      title: t('legacyValueAiTitle', undefined, 'Assistant IA'),
      headline: t('legacyValueAiHeadline', undefined, 'Votre copilote de productivité'),
      points: [
        t('legacyValueAiPoint1', undefined, 'Plan de journée, priorités, relances'),
        t('legacyValueAiPoint2', undefined, 'Conseils personnalisés selon vos données'),
        t('legacyValueAiPoint3', undefined, 'Intégration WhatsApp pour agir partout'),
      ],
    },
  ];

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
        <TouchableOpacity style={styles.cta} onPress={next}>
          <Text style={styles.ctaText}>
            {index < slides.length - 1 ? t('next') : t('continue')}
          </Text>
        </TouchableOpacity>
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
