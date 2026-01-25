import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ExamSummaryScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const duration = parseInt(params.duration as string) || 0;
  const completed = parseInt(params.completed as string) || 0;
  
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [moodLevel, setMoodLevel] = useState<number | null>(null);

  const handleBackToDashboard = () => {
    router.replace('/(tabs)');
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

        {/* XP (if system exists) */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.xpSection}>
          <View style={styles.xpCard}>
            <Text style={styles.xpLabel}>{t('xpGained')}</Text>
            <Text style={styles.xpValue}>+{completed * 10}</Text>
          </View>
        </Animated.View>

        {/* Quick Check-ins */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.checkInSection}>
          <Text style={styles.checkInTitle}>{t('quickCheckIn') || 'Quick check-in'}</Text>
          
          <View style={styles.checkInItem}>
            <Text style={styles.checkInLabel}>{t('stressNow')}</Text>
            <View style={styles.ratingButtons}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.ratingButton,
                    stressLevel === level && styles.ratingButtonActive,
                  ]}
                  onPress={() => setStressLevel(level)}
                >
                  <Text
                    style={[
                      styles.ratingText,
                      stressLevel === level && styles.ratingTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.checkInItem}>
            <Text style={styles.checkInLabel}>{t('moodNow')}</Text>
            <View style={styles.ratingButtons}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.ratingButton,
                    moodLevel === level && styles.ratingButtonActive,
                  ]}
                  onPress={() => setMoodLevel(level)}
                >
                  <Text
                    style={[
                      styles.ratingText,
                      moodLevel === level && styles.ratingTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* CTAs */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleBackToDashboard}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{t('backToDashboard')}</Text>
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

