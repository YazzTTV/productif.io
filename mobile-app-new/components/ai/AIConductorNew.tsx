import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Action {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  isPremium?: boolean;
  previewAvailable?: boolean;
}

const actions: Action[] = [
  {
    id: 'focus',
    icon: 'scan-outline',
    label: 'Commencer la concentration',
  },
  {
    id: 'exam',
    icon: 'school-outline',
    label: 'Mode Examen',
    previewAvailable: true,
    isPremium: true,
  },
  {
    id: 'tasks',
    icon: 'checkbox-outline',
    label: 'Vos Tâches',
    subtitle: 'Organisées par matière et impact.',
  },
  {
    id: 'habits',
    icon: 'list-outline',
    label: 'Examiner les habitudes',
  },
  {
    id: 'plan',
    icon: 'calendar-outline',
    label: 'Planifier ma journée',
    previewAvailable: true,
    isPremium: true,
  },
  {
    id: 'journal',
    icon: 'book-outline',
    label: 'Journal quotidien',
  },
];

export function AIConductorNew() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'focus':
        router.push('/focus');
        break;
      case 'exam':
        router.push('/exam-mode');
        break;
      case 'tasks':
        router.push('/tasks-new');
        break;
      case 'habits':
        router.push('/review-habits');
        break;
      case 'plan':
        router.push('/plan-my-day');
        break;
      case 'journal':
        router.push('/daily-journal');
        break;
    }
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Votre système est prêt.</Text>
            <Text style={styles.headerSubtitle}>Aujourd'hui est structuré pour le travail profond.</Text>
          </View>
        </Animated.View>

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <Animated.View
              key={action.id}
              entering={FadeInDown.delay(200 + index * 80).duration(400)}
            >
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleAction(action.id)}
                activeOpacity={0.7}
              >
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Ionicons name={action.icon} size={24} color="#000" />
                </View>

                {/* Content */}
                <View style={styles.actionContent}>
                  <View style={styles.actionHeader}>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                    {action.isPremium && (
                      <View style={styles.premiumBadge}>
                        <Ionicons name="lock-closed" size={10} color="rgba(0,0,0,0.6)" />
                        <Text style={styles.premiumText}>Premium</Text>
                      </View>
                    )}
                  </View>
                  {action.subtitle && (
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  )}
                  {action.previewAvailable && !action.subtitle && (
                    <Text style={styles.actionSubtitle}>Aperçu disponible</Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

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
    gap: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerContent: {
    gap: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
    lineHeight: 38,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  actionsContainer: {
    gap: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.5,
    color: '#000000',
    flex: 1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  premiumText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 4,
  },
});

