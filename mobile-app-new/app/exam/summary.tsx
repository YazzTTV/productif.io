import { StudyCheckIn } from '@/components/analytics/StudyCheckIn';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { maybeAskForReview } from '@/lib/reviewPrompt';

export default function ExamSummaryScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const duration = parseInt(params.duration as string) || 0;
  const completed = parseInt(params.completed as string) || 0;

  // Moment de valeur : une session de Mode Examen terminée avec au moins une
  // tâche bouclée. Une session où rien n'a été fait n'est pas un bon moment
  // pour demander une note, et chaque demande consomme un quota annuel.
  // Le délai laisse les animations d'entrée finir (la dernière est à 500+400 ms)
  // pour que la feuille d'Apple ne s'ouvre pas sur un écran encore en mouvement.
  useEffect(() => {
    if (completed < 1) return;
    const timer = setTimeout(() => {
      maybeAskForReview('exam_session_completed');
    }, 1200);
    return () => clearTimeout(timer);
  }, [completed]);

  const handleBackToDashboard = () => {
    router.replace({pathname:'/(tabs)/assistant',params:{tab:'analytics'}});
  };

  const handleStartAnother = () => {
    router.replace('/exam/setup');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('sessionComplete') || 'Session Complete'}</Text>
            <Text style={styles.headerSubtitle}>{t('greatWorkToday') || 'Great work today'}</Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsSection}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#16A34A" />
            <Text style={styles.statValue}>{duration}</Text>
            <Text style={styles.statLabel}>{t('minutesFocused') || 'Minutes focused'}</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#16A34A" />
            <Text style={styles.statValue}>{completed}</Text>
            <Text style={styles.statLabel}>{t('tasksCompleted')}</Text>
          </View>
        </Animated.View>

        {!!params.studySessionId && <StudyCheckIn sessionId={String(params.studySessionId)} />}

        {/* CTAs */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleBackToDashboard}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{t('analyticsTab')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleStartAnother}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>{t('startAnotherSession')}</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.1)',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  xpSection: {
    marginBottom: 24,
  },
  xpCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 8,
  },
  xpValue: {
    fontSize: 48,
    fontWeight: '600',
    color: '#16A34A',
  },
  checkInSection: {
    marginBottom: 32,
  },
  checkInTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },
  checkInItem: {
    marginBottom: 24,
  },
  checkInLabel: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 12,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#16A34A',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  ratingTextActive: {
    color: '#FFFFFF',
  },
  ctaSection: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  secondaryButtonText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
});

