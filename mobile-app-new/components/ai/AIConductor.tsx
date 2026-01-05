import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';

interface Action {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descriptionKey: string;
  gradient: boolean;
}

const actions: Action[] = [
  {
    id: 'plan',
    icon: 'calendar-outline',
    titleKey: 'planMyDay',
    descriptionKey: 'generateOptimizedSchedule',
    gradient: true,
  },
  {
    id: 'focus',
    icon: 'eye-outline',
    titleKey: 'startFocusAction',
    descriptionKey: 'beginMainPriority',
    gradient: false,
  },
  {
    id: 'habits',
    icon: 'list-outline',
    titleKey: 'manageHabits',
    descriptionKey: 'viewUpdateHabits',
    gradient: false,
  },
  {
    id: 'journal',
    icon: 'book-outline',
    titleKey: 'dailyJournal',
    descriptionKey: 'reflectOnProgress',
    gradient: false,
  },
];

interface Insight {
  title: string;
  detail: string;
}

export function AIConductor() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  const insights: Insight[] = [
    { title: t('focusPeaks'), detail: t('scheduleHardTasksEarly') },
    { title: t('restDaysImprove'), detail: t('sundayRecovery') },
    { title: t('workBestIn90Min'), detail: t('adjustedSchedule') },
  ];

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'plan':
        setSystemMessage('Journée planifiée. Consultez votre dashboard.');
        setTimeout(() => {
          setSystemMessage(null);
          router.push('/(tabs)');
        }, 2000);
        break;
      case 'focus':
        router.push('/focus');
        break;
      case 'habits':
        router.push('/habits-manager');
        break;
      case 'journal':
        setSystemMessage('Journal enregistré.');
        setTimeout(() => setSystemMessage(null), 2000);
        break;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="sparkles" size={20} color="#16A34A" />
            <Text style={styles.headerTitle}>{t('aiConductor')}</Text>
          </View>
          <Text style={styles.headerSubtitle}>{t('systemActions')}</Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* System Message */}
        {systemMessage && (
          <Animated.View 
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={styles.messageCard}
          >
            <Text style={styles.messageText}>{systemMessage}</Text>
          </Animated.View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('whatWouldYouLikeToDo')}</Text>
          <View style={styles.actionsList}>
            {actions.map((action, index) => (
              <Animated.View
                key={action.id}
                entering={FadeInDown.delay(200 + index * 100).duration(400)}
              >
                <TouchableOpacity
                  style={[styles.actionCard, action.gradient && styles.actionCardGradient]}
                  onPress={() => handleAction(action.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name={action.icon} size={24} color="#16A34A" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>{t(action.titleKey as any)}</Text>
                    <Text style={styles.actionDescription}>{t(action.descriptionKey as any)}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Info */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.infoCard}>
          <Text style={styles.infoText}>{t('noChatMode')}</Text>
        </Animated.View>

        {/* Insights */}
        <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t('recentInsights')}</Text>
          <View style={styles.insightsList}>
            {insights.map((insight, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(800 + index * 100).duration(400)}
                style={styles.insightCard}
              >
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDetail}>{insight.detail}</Text>
              </Animated.View>
            ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  messageCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    marginBottom: 24,
  },
  messageText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#16A34A',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 16,
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  actionCardGradient: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderColor: 'rgba(22, 163, 74, 0.1)',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  infoCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  insightTitle: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 8,
  },
  insightDetail: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
});

