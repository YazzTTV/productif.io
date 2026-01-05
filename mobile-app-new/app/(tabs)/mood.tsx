import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';

interface MoodOption {
  emoji: string;
  label: string;
  color: string;
}

const moodOptions: MoodOption[] = [
  { emoji: '😊', label: 'Great', color: '#16A34A' },
  { emoji: '🙂', label: 'Good', color: '#84CC16' },
  { emoji: '😐', label: 'Okay', color: '#EAB308' },
  { emoji: '😔', label: 'Low', color: '#F97316' },
  { emoji: '😫', label: 'Stressed', color: '#EF4444' },
];

export default function MoodScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
          <Text style={styles.title}>{t('mood')}</Text>
          <Text style={styles.subtitle}>Comment vous sentez-vous aujourd'hui ?</Text>
        </Animated.View>

        {/* Mood Selection */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.moodSection}>
          <View style={styles.moodGrid}>
            {moodOptions.map((mood, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.moodButton,
                  selectedMood === index && { borderColor: mood.color, backgroundColor: `${mood.color}10` }
                ]}
                onPress={() => setSelectedMood(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodLabel, selectedMood === index && { color: mood.color }]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.statsSection}>
          <Text style={styles.sectionLabel}>Tendance de la semaine</Text>
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('focus')}</Text>
              <View style={styles.statBarContainer}>
                <View style={[styles.statBar, { width: '72%', backgroundColor: '#16A34A' }]} />
              </View>
              <Text style={styles.statValue}>72%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('energy')}</Text>
              <View style={styles.statBarContainer}>
                <View style={[styles.statBar, { width: '65%', backgroundColor: '#16A34A' }]} />
              </View>
              <Text style={styles.statValue}>65%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('stress')}</Text>
              <View style={styles.statBarContainer}>
                <View style={[styles.statBar, { width: '38%', backgroundColor: '#F97316' }]} />
              </View>
              <Text style={styles.statValue}>38%</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.actionsSection}>
          <Text style={styles.sectionLabel}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="fitness-outline" size={24} color="#16A34A" />
              <Text style={styles.actionLabel}>Respiration</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="musical-notes-outline" size={24} color="#16A34A" />
              <Text style={styles.actionLabel}>Méditation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="walk-outline" size={24} color="#16A34A" />
              <Text style={styles.actionLabel}>Pause</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  moodSection: {
    marginBottom: 32,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  moodButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  moodEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 12,
  },
  statsCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 15,
    color: '#000000',
    width: 70,
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    textAlign: 'right',
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
});

