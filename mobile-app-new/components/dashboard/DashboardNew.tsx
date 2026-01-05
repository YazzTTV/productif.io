import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { authService } from '@/lib/api';

interface TimelineEvent {
  time: string;
  title: string;
  isActive: boolean;
}

interface DayStructure {
  startTime: string;
  endTime: string;
  title: string;
  subject: string;
  tasks: string[];
  habitTag?: string;
}

export function DashboardNew() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  
  const [userName, setUserName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Obtenir le bon message de salutation
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadData = async () => {
    try {
      const user = await authService.checkAuth();
      if (user?.name) {
        setUserName(user.name.split(' ')[0]);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Structure du jour
  const dayStructure: DayStructure = {
    startTime: '09:00',
    endTime: '10:30',
    title: 'Complete Chapter 12 Summary',
    subject: 'Organic Chemistry',
    tasks: [
      'Review lecture notes · 30 min',
      'Practice problems 15-20 · 45 min',
    ],
    habitTag: 'Morning review',
  };

  // Timeline des moments clés
  const timelineEvents: TimelineEvent[] = [
    { time: '09:00', title: 'Morning focus', isActive: true },
    { time: '11:30', title: 'Break', isActive: false },
    { time: '14:00', title: 'Afternoon focus', isActive: false },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#16A34A" />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{userName || 'dwxcw'}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/parametres')}
          >
            <Ionicons name="settings-outline" size={22} color="#000" />
          </TouchableOpacity>
        </Animated.View>

        {/* Today's Structure */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Today's structure</Text>
          
          <View style={styles.structureCard}>
            {/* Time Badge */}
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={16} color="#16A34A" />
              <Text style={styles.timeText}>
                {dayStructure.startTime} - {dayStructure.endTime}
              </Text>
            </View>

            {/* Main Title */}
            <Text style={styles.structureTitle}>{dayStructure.title}</Text>
            <Text style={styles.structureSubject}>{dayStructure.subject}</Text>

            {/* Task List */}
            <View style={styles.taskList}>
              {dayStructure.tasks.map((task, index) => (
                <View key={index} style={styles.taskItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.taskText}>{task}</Text>
                </View>
              ))}
            </View>

            {/* Habit Tag */}
            {dayStructure.habitTag && (
              <View style={styles.habitTag}>
                <View style={styles.habitDot} />
                <Text style={styles.habitText}>{dayStructure.habitTag}</Text>
              </View>
            )}

            {/* Start Focus Button */}
            <TouchableOpacity
              style={styles.startFocusButton}
              onPress={() => router.push('/focus')}
              activeOpacity={0.8}
            >
              <Text style={styles.startFocusText}>Start to Focus</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Key Moments Today */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Key moments today</Text>
          
          <View style={styles.timeline}>
            {timelineEvents.map((event, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineDot,
                    event.isActive && styles.timelineDotActive
                  ]} />
                  {index < timelineEvents.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                <View style={[
                  styles.timelineCard,
                  event.isActive && styles.timelineCardActive
                ]}>
                  <Text style={[
                    styles.timelineTime,
                    event.isActive && styles.timelineTimeActive
                  ]}>
                    {event.time}
                  </Text>
                  <Text style={[
                    styles.timelineTitle,
                    event.isActive && styles.timelineTitleActive
                  ]}>
                    {event.title}
                  </Text>
                  {event.isActive && (
                    <View style={styles.activeIndicator} />
                  )}
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Community Progress */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.section}>
          <View style={styles.communityHeader}>
            <View>
              <Text style={styles.communityTitle}>Community Progress</Text>
              <Text style={styles.communitySubtitle}>Your group this week</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/leaderboard')}>
              <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.4)" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarGroup}>
            {['M', 'You', 'A', 'E', 'L'].map((initial, index) => (
              <View key={index} style={styles.avatarContainer}>
                <View style={[
                  styles.avatar,
                  initial === 'You' && styles.avatarActive
                ]}>
                  <Text style={[
                    styles.avatarText,
                    initial === 'You' && styles.avatarTextActive
                  ]}>
                    {initial === 'You' ? '✓' : initial}
                  </Text>
                </View>
                <Text style={[
                  styles.avatarLabel,
                  initial === 'You' && styles.avatarLabelActive
                ]}>
                  {initial}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.viewLeaderboardButton}
            onPress={() => router.push('/(tabs)/leaderboard')}
          >
            <Text style={styles.viewLeaderboardText}>View full leaderboard →</Text>
          </TouchableOpacity>
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
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -1,
    color: '#000000',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 16,
  },
  structureCard: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.15)',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
  },
  structureTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#000000',
    marginBottom: 8,
  },
  structureSubject: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 20,
  },
  taskList: {
    gap: 8,
    marginBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    marginTop: 6,
  },
  taskText: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.7)',
    flex: 1,
  },
  habitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  habitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  habitText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  startFocusButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  startFocusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D1D5DB',
    marginTop: 8,
  },
  timelineDotActive: {
    backgroundColor: '#16A34A',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    minHeight: 40,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  timelineCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.5)',
    marginBottom: 4,
  },
  timelineTimeActive: {
    color: '#16A34A',
  },
  timelineTitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  timelineTitleActive: {
    color: '#000000',
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  communityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  communitySubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  avatarGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActive: {
    backgroundColor: '#16A34A',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarTextActive: {
    fontSize: 24,
  },
  avatarLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  avatarLabelActive: {
    color: '#16A34A',
    fontWeight: '600',
  },
  viewLeaderboardButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewLeaderboardText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
  },
});

